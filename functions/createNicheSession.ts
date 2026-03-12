import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { ventureName, videoId } = await req.json();

    if (!ventureName) {
      return Response.json({ error: 'Venture name is required' }, { status: 400 });
    }

    // Create new specific session
    const newSession = await base44.entities.AccumulationSession.create({
      session_type: 'specific',
      genre: ventureName,
      accumulated_videos: videoId ? [{
        video_id: videoId,
        order: 1,
        session_rating: 'watch',
        session_rating_rationale: 'Initial video that inspired this niche exploration'
      }] : [],
      summarized_execution_claims: {
        entry: [],
        validation: [],
        execution: [],
        scale: []
      }
    });

    return Response.json({ 
      success: true, 
      sessionId: newSession.id,
      genre: ventureName
    });

  } catch (error) {
    console.error('Error creating niche session:', error);
    return Response.json({ 
      error: error.message || 'Failed to create niche session' 
    }, { status: 500 });
  }
});