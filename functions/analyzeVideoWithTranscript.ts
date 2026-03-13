import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import OpenAI from 'npm:openai@4.77.3';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { videoId, accumulationData } = await req.json();

        // Fetch video from database
        const videos = await base44.entities.Video.filter({ id: videoId });
        const video = videos[0];

        if (!video) {
            return Response.json({ error: 'Video not found' }, { status: 404 });
        }

        console.log("[DEBUG] Video fetched:", videoId, "| has_transcript:", video.has_transcript);

        // API Keys (Prioritize Deno env, fallback to user provided for Claude)
        const OPENAI_API_KEY = Deno.env.get("OpenAIAPI");
        const CLAUDE_API_KEY = Deno.env.get("ClaudeAPI");

        // Normalize transcript to timestamped segments
        const normalizeTranscript = (transcriptArray: any[]) => {
            if (!transcriptArray || transcriptArray.length === 0) return null;

            return transcriptArray.map(segment => {
                const hours = Math.floor(segment.start / 3600);
                const minutes = Math.floor((segment.start % 3600) / 60);
                const seconds = Math.floor(segment.start % 60);

                const timestamp = hours > 0
                    ? `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
                    : `${minutes}:${String(seconds).padStart(2, '0')}`;

                return {
                    timestamp,
                    text: segment.text
                };
            });
        };

        // Fetch Metadata (YouTube)
        const fetchMetadata = async () => {
            if (video.youtube_id && (video.title === 'Fetching...' || !video.title || video.title === 'YouTube Video')) {
                try {
                    const youtubeApiKey = Deno.env.get("YoutubeAPI");
                    if (youtubeApiKey) {
                        const youtubeResponse = await fetch(
                            `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${video.youtube_id}&key=${youtubeApiKey}`
                        );
                        if (youtubeResponse.ok) {
                            const youtubeData = await youtubeResponse.json();
                            if (youtubeData.items && youtubeData.items.length > 0) {
                                const snippet = youtubeData.items[0].snippet;
                                return { title: snippet.title, channel: snippet.channelTitle };
                            }
                        }
                    }
                } catch (error) {
                    console.error('[DEBUG] YouTube metadata error:', (error as Error).message);
                }
            }
            return null;
        };

        // Fetch Transcript (Supadata)
        const fetchTranscriptFromSupadata = async () => {
            if (!video.youtube_id) return null;
            try {
                const supadataApiKey = Deno.env.get("SupadataKey");
                if (!supadataApiKey) return null;
                const youtubeUrl = `https://www.youtube.com/watch?v=${video.youtube_id}`;
                
                let supadataResponse = await fetch(
                    `https://api.supadata.ai/v1/transcript?url=${encodeURIComponent(youtubeUrl)}&text=false&mode=auto`,
                    { headers: { 'x-api-key': supadataApiKey } }
                );

                if (supadataResponse.ok) {
                    const supadataData = await supadataResponse.json();
                    if (supadataData.content && Array.isArray(supadataData.content)) {
                        return supadataData.content.map(segment => ({
                            start: segment.offset / 1000,
                            end: (segment.offset + segment.duration) / 1000,
                            text: segment.text
                        }));
                    }
                }
            } catch (error) {
                console.error('[DEBUG] Supadata transcript error:', (error as Error).message);
            }
            return null;
        };

        let transcriptSegments = normalizeTranscript(video.transcript);
        let videoTitle = video.title;
        let finalMetadataUpdate: any = {};

        if (!transcriptSegments || transcriptSegments.length === 0) {
            const [metadata, fetchedTranscript] = await Promise.all([fetchMetadata(), fetchTranscriptFromSupadata()]);
            if (metadata) { videoTitle = metadata.title; finalMetadataUpdate = { title: metadata.title, channel: metadata.channel }; }
            if (fetchedTranscript) {
                await base44.entities.Video.update(videoId, { ...finalMetadataUpdate, transcript: fetchedTranscript, has_transcript: true });
                transcriptSegments = normalizeTranscript(fetchedTranscript);
                finalMetadataUpdate = {};
            }
        }

        if (!transcriptSegments) {
            return Response.json({ error: 'Transcript Fetching Failed' }, { status: 400 });
        }

        const transcriptText = transcriptSegments.map(seg => `[${seg.timestamp}] ${seg.text}`).join('\n');
        const truncatedTranscript = transcriptText.substring(0, 40000);

        // ── PARALLEL MULTI-MODEL PIPELINE ──
        console.log(`[DEBUG] Starting Parallel Analysis: Model 1 (OpenAI) & Model 2 (Claude)`);

        // Model 1 Call: OpenAI for Structural Extraction (Chapters)
        const callModel1_OpenAI = async () => {
            try {
                const response = await fetch('https://api.openai.com/v1/chat/completions', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        model: "gpt-4o-mini", // Cost efficient for structural tasks
                        messages: [
                            { role: "system", content: "Analyze the video transcript for structural segments. Identify chapters with timestamps, titles, and short descriptions. Output ONLY raw JSON." },
                            { role: "user", content: `Video Title: "${videoTitle}"\n\nTranscript:\n${truncatedTranscript}\n\nOutput Format: { "chapters": [ { "timestamp": "MM:SS", "title": "...", "description": "..." } ] }` }
                        ],
                        response_format: { type: "json_object" }
                    })
                });
                const data = await response.json();
                return JSON.parse(data.choices[0].message.content);
            } catch (e) {
                console.error("[DEBUG] OpenAI Model 1 Error:", e);
                return { chapters: [] };
            }
        };

        // Model 2 Call: Claude for Venture Reasoning (Venture Discovery + Execution)
        const callModel2_Claude = async () => {
            try {
                const response = await fetch('https://api.anthropic.com/v1/messages', {
                    method: 'POST',
                    headers: {
                        'x-api-key': CLAUDE_API_KEY,
                        'anthropic-version': '2023-06-01',
                        'content-type': 'application/json'
                    },
                    body: JSON.stringify({
                        model: "claude-3-5-sonnet-20240620",
                        max_tokens: 3000,
                        system: `You are the FEASIX VIDEO ANALYSIS SYSTEM. 
Detect the business model, summarize the video, and extract execution requirements categorized into four stages: ENTRY, VALIDATION, EXECUTION, and SCALE.
Requirements must have a label and a related timestamp from the transcript.
Output ONLY raw JSON.`,
                        messages: [
                            { role: "user", content: `Video Title: "${videoTitle}"\n\nTranscript:\n${truncatedTranscript}\n\nOutput Format:
{
  "venture_summary": {
    "what_the_business_is": "...",
    "what_the_video_talks_about": "..."
  },
  "execution_requirements": {
    "entry": [ { "label": "...", "timestamp": "..." } ],
    "validation": [...],
    "execution": [...],
    "scale": [...]
  },
  "signal_density": 85,
  "feasix_verdict": "Detailed reasoning here...",
  "final_rating": "WATCH"
}` }
                        ]
                    })
                });
                const data = await response.json();
                return JSON.parse(data.content[0].text);
            } catch (e) {
                console.error("[DEBUG] Claude Model 2 Error:", e);
                return null;
            }
        };

        // Execute both calls in parallel
        const [model1Data, model2Data] = await Promise.all([callModel1_OpenAI(), callModel2_Claude()]);

        if (!model2Data) {
            throw new Error('Claude Analysis Failed');
        }

        // ── MERGE AND STORE ──
        const finalUpdateData = {
            ...finalMetadataUpdate,
            talking_points: model1Data.chapters.map((c: any) => ({ timestamp: c.timestamp, label: c.title })),
            raw_friction_analysis_output: { ...model1Data, ...model2Data },
            friction_analysis: {
                FEASIX_VERDICT: model2Data.feasix_verdict,
                execution_requirements: model2Data.execution_requirements,
                venture_summary: model2Data.venture_summary,
                final_verdict: { rating: model2Data.final_rating, reason: model2Data.feasix_verdict },
                signal_density_rationale: model2Data.feasix_verdict
            },
            rating: model2Data.final_rating?.toLowerCase(),
            signal_density: model2Data.signal_density,
            last_evaluated: new Date().toISOString()
        };

        await base44.entities.Video.update(videoId, finalUpdateData);
        console.log(`[DEBUG] Final Merge Completed for ${videoId}`);

        return Response.json({ success: true, analysis: finalUpdateData });

    } catch (error) {
        console.error('Error:', error);
        return Response.json({ success: false, error: (error as Error).message }, { status: 500 });
    }
});