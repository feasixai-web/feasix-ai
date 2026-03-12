import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { videoId, sessionId } = await req.json();

    if (!videoId) {
      return Response.json({ error: 'Missing videoId' }, { status: 400 });
    }

    const videos = await base44.entities.Video.filter({ id: videoId });
    const currentVideo = videos[0];
    if (!currentVideo) {
      return Response.json({ error: 'Video not found' }, { status: 404 });
    }

    if (currentVideo.video_type !== 'specific') {
        return Response.json({ insights: [] });
    }

    // Build context of prior insights if sessionId is provided
    let priorInsightsContext = '';
    if (sessionId) {
      const sessions = await base44.entities.AccumulationSession.filter({ id: sessionId });
      const session = sessions[0];
      
      if (session && session.accumulated_videos) {
        const priorVideoIds = session.accumulated_videos
          .filter(v => v.video_id !== videoId)
          .map(v => v.video_id);
        
        if (priorVideoIds.length > 0) {
          const priorVideos = await base44.asServiceRole.entities.Video.filter({ id: { $in: priorVideoIds } });
          const priorInsights = priorVideos
            .map(v => v.friction_analysis?.key_details?.map(d => d.detail) || [])
            .flat()
            .filter(Boolean)
            .slice(0, 15);
          
          if (priorInsights.length > 0) {
            priorInsightsContext = `\n\nALREADY COVERED in previous videos in this session:\n${priorInsights.join('\n')}\n\nDO NOT repeat or rephrase these concepts.`;
          }
        }
      }
    }

    const prompt = `You are extracting 3 specific, actionable "Pro-tip" style insights from a video. These should be tactical details, not broad advice.

Video Title: "${currentVideo.title}"

KEY DETAILS (from analysis):
${(currentVideo.friction_analysis?.key_details || []).map(d => `- ${d.detail}`).join('\n')}

NUANCES:
${(currentVideo.friction_analysis?.nuances || []).map(n => typeof n === 'string' ? `- ${n}` : `- ${n.nuance}`).join('\n')}

EXTRACTION RULES:
1. Extract exactly 3 insights (or fewer if fewer are available)
2. Each insight must be specific, tactical, and actionable (max 100 characters each)
3. Format: imperative verb + specific detail (e.g., "Reinvest 20% of earnings into ad spend" not "Consider reinvesting")
4. Avoid vague, broad advice
5. Prioritize surprising or non-obvious details${priorInsightsContext}

Return JSON with exactly this structure:
{
  "insights": ["insight 1", "insight 2", "insight 3"]
}`;

    const analysis = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          insights: {
            type: 'array',
            items: { type: 'string' }
          }
        }
      }
    });

    return Response.json({
      success: true,
      insights: (analysis.insights || []).filter(Boolean).slice(0, 3)
    });

  } catch (error) {
    console.error('Error identifying video insights:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});