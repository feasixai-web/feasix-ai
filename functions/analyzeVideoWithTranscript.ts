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

        console.log("[DEBUG] Video fetched:", videoId, "| has_transcript:", video.has_transcript, "| transcript length:", video.transcript?.length ?? "null");


        // Initialize OpenAI client
        const openai = new OpenAI({
            apiKey: Deno.env.get("OpenAIAPI")
        });

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

        // Initialize fetch promises
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
                    console.error('[DEBUG] Error fetching YouTube metadata:', (error as Error).message);
                }
            }
            return null;
        };

        const fetchTranscriptFromSupadata = async () => {
            if (!video.youtube_id) return null;
            try {
                const supadataApiKey = Deno.env.get("SupadataKey");
                if (!supadataApiKey) {
                    console.error('[DEBUG] SupadataKey not configured');
                    return null;
                }
                const youtubeUrl = `https://www.youtube.com/watch?v=${video.youtube_id}`;
                console.log(`[DEBUG] Parallel fetch: transcript from Supadata for URL: ${youtubeUrl}`);

                let supadataResponse = await fetch(
                    `https://api.supadata.ai/v1/transcript?url=${encodeURIComponent(youtubeUrl)}&text=false&mode=auto`,
                    { headers: { 'x-api-key': supadataApiKey } }
                );

                if (supadataResponse.status === 429) {
                    console.log('[DEBUG] Parallel fetch: Supadata rate limited, waiting 3s...');
                    await new Promise(resolve => setTimeout(resolve, 3000));
                    supadataResponse = await fetch(
                        `https://api.supadata.ai/v1/transcript?url=${encodeURIComponent(youtubeUrl)}&text=false&mode=auto`,
                        { headers: { 'x-api-key': supadataApiKey } }
                    );
                }

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
                console.error('[DEBUG] Error fetching transcript from Supadata:', (error as Error).message);
            }
            return null;
        };

        // Run both fetches in parallel if transcript is missing
        let transcriptSegments = normalizeTranscript(video.transcript);
        let videoTitle = video.title;
        let finalMetadataUpdate: any = {};

        if (!transcriptSegments || transcriptSegments.length === 0) {
            console.log("[DEBUG] Transcript missing. Starting parallel fetch for metadata and transcript...");
            const [metadata, fetchedTranscript] = await Promise.all([
                fetchMetadata(),
                fetchTranscriptFromSupadata()
            ]);

            if (metadata) {
                videoTitle = metadata.title;
                finalMetadataUpdate = {
                    title: metadata.title,
                    channel: metadata.channel
                };
                console.log(`[DEBUG] Prepared metadata update: ${metadata.title}`);
            }

            if (fetchedTranscript) {
                // Save transcript immediately so polling frontend can see it
                await base44.entities.Video.update(videoId, {
                    ...finalMetadataUpdate,
                    transcript: fetchedTranscript,
                    has_transcript: true
                });
                transcriptSegments = normalizeTranscript(fetchedTranscript);
                console.log(`[DEBUG] Transcript fetched and saved immediately (parallel)`);
                // Clear metadata update as it's already applied
                finalMetadataUpdate = {};
            }
        } else {
            // Even if transcript exists, we might want to refresh metadata if it's missing
            const metadata = await fetchMetadata();
            if (metadata) {
                videoTitle = metadata.title;
                finalMetadataUpdate = {
                    title: metadata.title,
                    channel: metadata.channel
                };
            }
        }

        // Final check for transcript
        if (!transcriptSegments || transcriptSegments.length === 0) {
            return Response.json({
                error: 'Pipeline Error: Transcript Fetching Failed - No transcript available for this video.'
            }, { status: 400 });
        }

        // Transcript mode - Execution Analysis v1.4
        console.log(`[DEBUG] Processing transcript-based analysis with Execution Analysis Prompt v1.4`);

        const transcriptText = transcriptSegments.map(seg => `[${seg.timestamp}] ${seg.text}`).join('\n');

        // Truncate transcript if too long to prevent timeout
        const maxTranscriptLength = 50000; // characters
        let truncatedTranscriptText = transcriptText;
        if (transcriptText.length > maxTranscriptLength) {
            truncatedTranscriptText = transcriptText.substring(0, maxTranscriptLength) + '\n\n[Transcript truncated for analysis...]';
            console.log(`[DEBUG] Transcript truncated from ${transcriptText.length} to ${maxTranscriptLength} characters`);
        }

        // Get user experience level, default to "novice" if not set
        const experienceLevel = video.user_level || "novice";

        // Prepare input text for the stored prompt
        const accumulationContext = accumulationData && (Array.isArray(accumulationData) ? accumulationData.length > 0 : true)
            ? `\n\nCanonical Structural Steps (Previous Context):\n${JSON.stringify(accumulationData, null, 2)}`
            : '';

        const inputText = `Video Title: "${videoTitle}"\nExperience Level: ${experienceLevel}${accumulationContext}\n\nTranscript (timestamped):\n${truncatedTranscriptText}`;

        // Use OpenAI stored prompt via Responses API
        console.log("[DEBUG] Sending request to OpenAI | inputText length:", inputText.length);
        const response = await fetch('https://api.openai.com/v1/responses', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${Deno.env.get("OpenAIAPI")}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                prompt: {
                    id: "pmpt_69b0a944780481908e258c161d56b97707ca9c382a9c6a76"
                },
                input: inputText
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Pipeline Error: OpenAI Analysis Failed - API returned status ${response.status}. ${errorText}`);
        }

        const completionData = await response.json();
        console.log('[DEBUG] Response type:', typeof completionData);
        console.log('[DEBUG] Is array:', Array.isArray(completionData));
        console.log('[DEBUG] Response keys:', Object.keys(completionData));
        console.log('[DEBUG] Full response sample:', JSON.stringify(completionData).substring(0, 500));

        // Parse the stored prompt response structure
        let analysis;

        // Handle different response formats
        if (completionData.output) {
            // Direct output field
            if (Array.isArray(completionData.output)) {
                const messageItem = completionData.output.find(item => item.type === 'message' && item.status === 'completed');
                if (messageItem && messageItem.content) {
                    const outputText = messageItem.content.find(c => c.type === 'output_text');
                    if (outputText && outputText.text) {
                        analysis = JSON.parse(outputText.text);
                    }
                }
            } else if (typeof completionData.output === 'string') {
                analysis = JSON.parse(completionData.output);
            } else {
                analysis = completionData.output;
            }
        } else if (Array.isArray(completionData)) {
            // Response is directly an array
            const messageItem = completionData.find(item => item.type === 'message' && item.status === 'completed');
            if (messageItem && messageItem.content) {
                const outputText = messageItem.content.find(c => c.type === 'output_text');
                if (outputText && outputText.text) {
                    analysis = JSON.parse(outputText.text);
                }
            }
        }

        if (!analysis) {
            throw new Error('Pipeline Error: Response Parsing Failed - Could not extract analysis data from OpenAI response. The AI may have returned an unexpected format.');
        }

        // Detect prompt format: v5.3 uses accumulation phases, legacy uses execution_steps array
        const isV5Format = !!analysis.accumulation;
        console.log(`[DEBUG] LLM analysis completed. Format: ${isV5Format ? 'v5.3 accumulation' : 'legacy execution_steps'}. Steps/phases present: ${isV5Format ? Object.keys(analysis.accumulation).join(',') : analysis.execution_steps?.length || 0}`);

        // Store the complete raw AI output
        const rawAnalysisOutput = analysis;

        // ── TALKING POINTS ──
        let parsedTalkingPoints = [];
        const talkingPointsRaw = analysis.talking_points || analysis.talking_point_extraction || analysis.TALKING_POINTS;
        if (talkingPointsRaw && Array.isArray(talkingPointsRaw)) {
            parsedTalkingPoints = talkingPointsRaw.map(point => {
                if (typeof point === 'object' && point !== null) {
                    const ts = point.timestamp ? point.timestamp.replace(/[\[\]]/g, '') : null;
                    return ts && point.label ? { timestamp: ts, label: point.label } : null;
                }
                const match = point.match(/^\[([^\]]+)\]\s*(.+)$/);
                return match ? { timestamp: match[1], label: match[2] } : null;
            }).filter(Boolean);
            console.log(`[DEBUG] Parsed ${parsedTalkingPoints.length} talking points`);
        }

        // ── EXECUTION STEPS + EXECUTION CLAIMS ──
        let limitedExecutionSteps = [];
        let executionClaims;

        if (isV5Format) {
            // v5.3: flatten whats_new items from each accumulation phase
            const phases = ['entry', 'validation', 'execution', 'scale'];
            const phaseStepNames = { entry: [], validation: [], execution: [], scale: [] };

            phases.forEach(phase => {
                const phaseData = analysis.accumulation[phase];
                const whatsNewArray = Array.isArray(phaseData?.whats_new) ? phaseData.whats_new : [];
                const repeatedArray = Array.isArray(phaseData?.repeated) ? phaseData.repeated : [];

                const toStep = item => ({
                    step_name: item.main_step || '',
                    step_summary: '',
                    process: Array.isArray(item.substeps) ? item.substeps : (typeof item.substeps === 'string' ? [item.substeps] : []),
                    unspoken_requirements: []
                });

                const newSteps = whatsNewArray.map(toStep);
                const repeatedSteps = repeatedArray.map(toStep);
                const allSteps = [...newSteps, ...repeatedSteps];

                phaseStepNames[phase] = allSteps.map(s => s.step_name).filter(Boolean);
                limitedExecutionSteps.push(...allSteps);
            });

            limitedExecutionSteps = limitedExecutionSteps.slice(0, 15);

            executionClaims = {};
            phases.forEach(phase => {
                executionClaims[phase] = {
                    status: phaseStepNames[phase].length > 0 ? 'Mentioned' : 'Omitted',
                    sub_points: phaseStepNames[phase]
                };
            });
        } else {
            // Legacy: sanitize execution_steps array and classify into phases
            limitedExecutionSteps = (analysis.execution_steps || []).map(step => ({
                step_name: step.step_name || 'Unnamed Step',
                step_summary: step.step_summary || '',
                process: Array.isArray(step.process) ? step.process : [],
                unspoken_requirements: Array.isArray(step.unspoken_requirements) ? step.unspoken_requirements.map(req => ({
                    factor: req.factor || 'resources',
                    detail: req.detail || '',
                    numeric_range: req.numeric_range || ''
                })) : []
            })).slice(0, 15);

            const classifyPhase = (name) => {
                if (/register|setup|create account|verify|choose plan|select|initial|start|begin|establish|set up|configure/i.test(name)) return 'entry';
                if (/test|validate|pilot|trial|proof|experiment|sample|analyze|research|evaluate|assess/i.test(name)) return 'validation';
                if (/scale|grow|expand|automate|optimize|hire|outsource|multiply|increase capacity|delegate/i.test(name)) return 'scale';
                return 'execution';
            };
            const phasedSteps = { entry: [], validation: [], execution: [], scale: [] };
            limitedExecutionSteps.forEach(step => phasedSteps[classifyPhase(step.step_name)].push(step.step_name));
            executionClaims = {};
            ['entry', 'validation', 'execution', 'scale'].forEach(phase => {
                executionClaims[phase] = {
                    status: phasedSteps[phase].length > 0 ? 'Mentioned' : 'Omitted',
                    sub_points: phasedSteps[phase]
                };
            });
        }

        console.log('[DEBUG] Classified execution claims by phase:', JSON.stringify(executionClaims));

        // ── TRANSFORMED STEPS (legacy frontend support) ──
        const transformedSteps = limitedExecutionSteps.map((step, idx) => {
            const skills = [], money = [], time = [], constraints = [];
            (step.unspoken_requirements || []).forEach(req => {
                const detail = req.numeric_range ? `${req.detail} (${req.numeric_range})` : req.detail;
                if (req.factor === 'skills') skills.push(detail);
                else if (req.factor === 'money') money.push(detail);
                else if (req.factor === 'time') time.push(detail);
                else constraints.push(detail);
            });
            return {
                step_number: idx + 1,
                title: step.step_name,
                skills_required: skills.length > 0 ? skills : undefined,
                money_required: money.length > 0 ? money : undefined,
                time_required: time.length > 0 ? time : undefined,
                constraints: constraints.length > 0 ? constraints : undefined
            };
        });

        // ── OVERALL FRICTION ──
        let overallFriction = 'medium';
        if (limitedExecutionSteps.length > 0) {
            const highFrictionCount = limitedExecutionSteps.filter(step => {
                const reqs = step.unspoken_requirements || [];
                const hasHighMoney = reqs.some(r => {
                    if (r.factor === 'money' && r.numeric_range) {
                        const m = r.numeric_range.match(/\$?([\d,]+)/);
                        return m && parseInt(m[1].replace(/,/g, '')) >= 2000;
                    }
                    return false;
                });
                const hasLongTime = reqs.some(r => r.factor === 'time' && r.numeric_range && /month|year|ongoing/i.test(r.numeric_range));
                const hasConstraints = reqs.some(r => r.factor === 'resources' || r.factor === 'connections');
                return hasHighMoney || hasLongTime || hasConstraints;
            }).length;
            const ratio = highFrictionCount / limitedExecutionSteps.length;
            overallFriction = ratio >= 0.6 ? 'high' : ratio >= 0.3 ? 'medium' : 'low';
        }
        console.log('[DEBUG] Calculated overall_friction:', overallFriction);

        // ── SIGNAL DENSITY ──
        let signalDensity = analysis.signal_density;
        if (!signalDensity) {
            const stepCount = limitedExecutionSteps.length;
            if (isV5Format) {
                const totalSubsteps = limitedExecutionSteps.reduce((sum, s) => sum + (s.process?.length || 0), 0);
                signalDensity = Math.min(Math.round(stepCount * 5 + totalSubsteps * 2), 100);
            } else {
                const avgReqs = stepCount > 0 ? limitedExecutionSteps.reduce((sum, s) => sum + (s.unspoken_requirements?.length || 0), 0) / stepCount : 0;
                signalDensity = Math.round(Math.min(stepCount * 5, 50) + Math.min(avgReqs * 10, 50));
            }
            console.log(`[DEBUG] Calculated signal_density: ${signalDensity}`);
        } else {
            console.log(`[DEBUG] Using provided signal_density: ${signalDensity}`);
        }

        // ── RATING / VERDICT ──
        let rating, ratingRationale, feasixVerdict, finalVerdict;
        if (isV5Format) {
            feasixVerdict = analysis.feasix_verdict || '';
            const ratingMatch = feasixVerdict.match(/verdict:\s*(watch|skim|skip)/i);
            rating = ratingMatch ? ratingMatch[1].toLowerCase() : 'skim';
            ratingRationale = feasixVerdict;
            finalVerdict = { rating: rating.toUpperCase(), reason: feasixVerdict };
        } else {
            feasixVerdict = analysis.FEASIX_VERDICT || '';
            rating = analysis.final_verdict?.rating?.toLowerCase() || 'skim';
            ratingRationale = analysis.signal_density_rationale || analysis.final_verdict?.reason || '';
            finalVerdict = analysis.final_verdict || { rating: 'SKIM', reason: 'Analysis incomplete' };
        }



        // ── NUANCES ──
        let parsedNuances = [];
        if (analysis.NUANCES && Array.isArray(analysis.NUANCES)) {
            parsedNuances = analysis.NUANCES.map(n => ({
                nuance: n.Nuance || n.nuance || '',
                verbatim_evidence_quote: n.Claim || n.claim || ''
            })).filter(n => n.nuance);
            console.log(`[DEBUG] Parsed ${parsedNuances.length} nuances`);
        }

        // BATCH UPDATE: Combine everything into one final database call
        const finalUpdateData = {
            ...finalMetadataUpdate,
            raw_friction_analysis_output: analysis,
            friction_analysis: {
                FEASIX_VERDICT: feasixVerdict,
                execution_steps: limitedExecutionSteps,
                execution_nuggets: analysis.execution_nuggets || [],
                final_verdict: finalVerdict,
                evidence: analysis.evidence || [],
                title: analysis.title || videoTitle,
                signal_density_rationale: ratingRationale,
                execution_claims: executionClaims,
                overall_friction: overallFriction,
                nuances: parsedNuances.length > 0 ? parsedNuances : (analysis.nuances || [])
            },
            execution_steps: transformedSteps,
            rating,
            rating_rationale: ratingRationale,
            signal_density: signalDensity,
            failure_points_discussed: analysis.failure_points_discussed || [],
            constraints_mentioned: analysis.constraints_mentioned || [],
            talking_points: parsedTalkingPoints,
            last_evaluated: new Date().toISOString()
        };

        await base44.entities.Video.update(videoId, finalUpdateData);
        console.log(`[DEBUG] Final batch update completed for video ${videoId}`);

        return Response.json({
            success: true,
            state: 'transcript_available',
            analysis: analysis
        });

    } catch (error) {
        console.error('Error:', error);
        return Response.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
});