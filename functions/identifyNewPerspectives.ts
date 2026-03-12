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

    // Fetch the current video
    const videos = await base44.entities.Video.filter({ id: videoId });
    const currentVideo = videos[0];
    if (!currentVideo) {
      return Response.json({ error: 'Video not found' }, { status: 404 });
    }

    // Fetch the session
    const sessions = await base44.entities.AccumulationSession.filter({ id: sessionId });
    const session = sessions[0];
    if (!session) {
      return Response.json({ error: 'Session not found' }, { status: 404 });
    }

    // Get all accumulated videos before this one
    const accumulatedVideos = session.accumulated_videos || [];
    const currentIndex = accumulatedVideos.findIndex(av => av.video_id === videoId);
    
    // If video is not in session yet, compare against all videos in the session
    const priorAccumulatedVideos = currentIndex === -1 
      ? accumulatedVideos 
      : accumulatedVideos.slice(0, currentIndex);
    
    let priorVideosContext = '';
    if (priorAccumulatedVideos.length > 0) {
      const priorVideoPromises = priorAccumulatedVideos.map(av =>
        base44.entities.Video.filter({ id: av.video_id }).then(videos => videos[0])
      );
      const priorVideos = await Promise.all(priorVideoPromises);

      priorVideosContext = priorVideos
        .filter(v => v)
        .map((v, idx) => {
          const av = priorAccumulatedVideos[idx];
          return `
Prior Video ${idx + 1}: "${v.title}"
- Session Rating: ${av.session_rating}
- Key Points: ${(v.key_points || []).slice(0, 3).join('; ')}
- Execution Claims (Entry): ${v.friction_analysis?.execution_claims?.entry?.sub_points ? v.friction_analysis.execution_claims.entry.sub_points.slice(0, 2).join('; ') : 'None'}
- Execution Claims (Execution): ${v.friction_analysis?.execution_claims?.execution?.sub_points ? v.friction_analysis.execution_claims.execution.sub_points.slice(0, 2).join('; ') : 'None'}
- Nuances: ${(v.nuances || []).slice(0, 2).join('; ')}`;
        })
        .join('\n\n');
    }

    // Build prompt to identify new perspectives
    const prompt = `You are a content analyst evaluating a video's unique contributions to an accumulation session on a specific topic/execution path.

${priorVideosContext ? `WHAT THE USER ALREADY KNOWS (from prior videos in this session):
${priorVideosContext}

` : 'This is the FIRST video in the session - all perspectives are new.\n'}

NEW VIDEO TO ANALYZE:
Title: "${currentVideo.title}"
Key Points: ${(currentVideo.key_points || []).slice(0, 5).join('; ')}
Execution Claims (Entry): ${currentVideo.friction_analysis?.execution_claims?.entry?.sub_points ? currentVideo.friction_analysis.execution_claims.entry.sub_points.slice(0, 3).join('; ') : 'None mentioned'}
Execution Claims (Execution): ${currentVideo.friction_analysis?.execution_claims?.execution?.sub_points ? currentVideo.friction_analysis.execution_claims.execution.sub_points.slice(0, 3).join('; ') : 'None mentioned'}
Nuances: ${(currentVideo.nuances || []).slice(0, 3).join('; ')}

TASK:
Identify 2-3 genuinely NEW and UNIQUE insights from this video that the user hasn't learned from prior videos.
- Use CONCISE wording (5-10 words per insight)
- Avoid repeating similar concepts with different words
- Focus ONLY on novel execution details, different approaches, or new constraints not previously mentioned
- If this video repeats a concept already covered, exclude it from the list
- If this is the first video, pick the 2-3 most actionable insights
- Return empty array [] if no new perspectives exist

Return a JSON object with:
{
  "new_perspectives": [
    "Concise, actionable new insight only",
    "Different approach or constraint not previously mentioned",
    "Novel execution detail" (only if truly new)
  ]
}`;

    const analysis = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          new_perspectives: {
            type: 'array',
            items: { type: 'string' }
          }
        }
      }
    });

    const perspectives = analysis.new_perspectives || [];

    // Save perspectives to the video entity
    await base44.asServiceRole.entities.Video.update(videoId, {
      perspectives_identified: perspectives
    });

    return Response.json({
      success: true,
      new_perspectives: perspectives,
      cached: false
    });

  } catch (error) {
    console.error('Error identifying new perspectives:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});