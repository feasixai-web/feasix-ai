import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { videoId, sessionId } = await req.json();

        if (!videoId || !sessionId) {
            return Response.json({ error: 'Missing videoId or sessionId' }, { status: 400 });
        }

        // Fetch the new video
        const videos = await base44.entities.Video.filter({ id: videoId });
        const newVideo = videos[0];
        if (!newVideo) {
            return Response.json({ error: 'Video not found' }, { status: 404 });
        }

        // Fetch the session
        const sessions = await base44.entities.AccumulationSession.filter({ id: sessionId });
        const session = sessions[0];
        if (!session) {
            return Response.json({ error: 'Session not found' }, { status: 404 });
        }

        // Validate video type matches session type
        const sessionType = session.session_type || 'general';
        const videoType = newVideo.video_type || 'general';
        
        if (videoType !== sessionType) {
            return Response.json({ 
                error: `Video type "${videoType}" doesn't match session type "${sessionType}". Only ${sessionType} videos can be added to this session.` 
            }, { status: 400 });
        }

        // Get existing videos in the session
        const accumulatedVideos = session.accumulated_videos || [];
        const nextOrder = accumulatedVideos.length + 1;

        // Fetch all previously added videos for context
        let priorVideosContext = '';
        if (accumulatedVideos.length > 0) {
            const priorVideoIds = accumulatedVideos.map(av => av.video_id);
            const priorVideoPromises = priorVideoIds.map(id => 
                base44.entities.Video.filter({ id }).then(videos => videos[0])
            );
            const priorVideos = await Promise.all(priorVideoPromises);
            
            priorVideosContext = priorVideos
                .filter(v => v)
                .map((v, idx) => {
                    const accVideoData = accumulatedVideos[idx];
                    return `
Video ${idx + 1}: "${v.title}"
- Global Rating: ${v.rating}
- Session Rating: ${accVideoData.session_rating}
- Signal Density: ${v.signal_density}
- Key Points: ${(v.key_points || []).slice(0, 3).join('; ')}
- Execution Claims (Entry): ${v.friction_analysis?.execution_claims?.entry?.sub_points ? v.friction_analysis.execution_claims.entry.sub_points.slice(0, 2).join('; ') : 'None'}
- Execution Claims (Execution): ${v.friction_analysis?.execution_claims?.execution?.sub_points ? v.friction_analysis.execution_claims.execution.sub_points.slice(0, 2).join('; ') : 'None'}`;
                })
                .join('\n\n');
        }

        // Build the prompt for session-specific rating
        const ratingPrompt = `
You are evaluating a new video being added to a user's accumulation session for a specific niche/execution path.

PRIOR VIDEOS IN THIS SESSION:
${priorVideosContext || 'No prior videos - this is the first video.'}

NEW VIDEO TO EVALUATE:
Title: "${newVideo.title}"
Global Rating: ${newVideo.rating}
Signal Density: ${newVideo.signal_density}
Key Points: ${(newVideo.key_points || []).slice(0, 5).join('; ')}
Execution Claims (Entry): ${newVideo.friction_analysis?.execution_claims?.entry?.sub_points ? newVideo.friction_analysis.execution_claims.entry.sub_points.slice(0, 3).join('; ') : 'None mentioned'}
Execution Claims (Execution): ${newVideo.friction_analysis?.execution_claims?.execution?.sub_points ? newVideo.friction_analysis.execution_claims.execution.sub_points.slice(0, 3).join('; ') : 'None mentioned'}
Nuances: ${(newVideo.nuances || []).slice(0, 3).join('; ')}

TASK:
Evaluate this new video's value GIVEN what the user has already learned from prior videos in this session.

RATING LOGIC (STRICT - FAVOR SKIM):
- WATCH: ONLY if this video introduces 3+ entirely NEW execution tactics/frameworks/processes that are CRITICAL and were NOT mentioned in any prior video. Must provide unique, production-ready insights. This should be RARE (10-15% of videos max).
- SKIM: DEFAULT rating. Use if ANY of: contains ANY redundancy with prior videos (even 20-30%), covers similar concepts with different wording, reinforces previous points, or provides incremental improvements. Most videos should get this rating.
- SKIP: More than 70% redundant with prior videos AND adds zero new actionable details. User gains nothing from watching.

Return:
{
  "session_rating": "watch" | "skim" | "skip",
  "session_rating_rationale": "2-3 sentences explaining why this rating was assigned given the prior videos in the session. Reference: what is NEW vs redundant."
}
`;

        const ratingAnalysis = await base44.asServiceRole.integrations.Core.InvokeLLM({
            prompt: ratingPrompt,
            response_json_schema: {
                type: "object",
                properties: {
                    session_rating: { 
                        type: "string", 
                        enum: ["skip", "skim", "watch"] 
                    },
                    session_rating_rationale: { type: "string" }
                }
            }
        });

        // Check if video already exists in accumulated_videos (pre-added during analysis start)
        const existingIndex = accumulatedVideos.findIndex(av => av.video_id === videoId);

        let updatedAccumulatedVideos;
        if (existingIndex >= 0) {
            // Update the existing entry with the real rating
            updatedAccumulatedVideos = accumulatedVideos.map((av, idx) =>
                idx === existingIndex
                    ? { ...av, session_rating: ratingAnalysis.session_rating, session_rating_rationale: ratingAnalysis.session_rating_rationale }
                    : av
            );
        } else {
            // Append new entry if not already present
            updatedAccumulatedVideos = [...accumulatedVideos, {
                video_id: videoId,
                order: nextOrder,
                session_rating: ratingAnalysis.session_rating,
                session_rating_rationale: ratingAnalysis.session_rating_rationale
            }];
        }

        await base44.entities.AccumulationSession.update(sessionId, {
            accumulated_videos: updatedAccumulatedVideos
        });

        return Response.json({
            success: true,
            order: nextOrder,
            session_rating: ratingAnalysis.session_rating,
            session_rating_rationale: ratingAnalysis.session_rating_rationale
        });

    } catch (error) {
        console.error('Error:', error);
        return Response.json({ 
            error: error.message 
        }, { status: 500 });
    }
});