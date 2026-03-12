import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { videoId, sessionId } = await req.json();
    if (!videoId || !sessionId) {
      return Response.json({ error: 'videoId and sessionId are required' }, { status: 400 });
    }

    // Fetch the video
    const videos = await base44.entities.Video.filter({ id: videoId });
    const video = videos[0];
    if (!video) return Response.json({ error: 'Video not found' }, { status: 404 });

    const accumulation = video.raw_friction_analysis_output?.accumulation;
    if (!accumulation) {
      return Response.json({ error: 'No accumulation data found on this video' }, { status: 400 });
    }

    // Fetch the session
    const sessions = await base44.entities.AccumulationSession.filter({ id: sessionId });
    const session = sessions[0];
    if (!session) return Response.json({ error: 'Session not found' }, { status: 404 });

    // Build the snapshot — always a single snapshot, overwriting any previous
    const snapshot = {
      video_id: videoId,
      video_title: video.title || 'Untitled',
      saved_at: new Date().toISOString(),
      accumulation
    };

    await base44.entities.AccumulationSession.update(sessionId, {
      video_accumulation_snapshots: [snapshot]
    });

    return Response.json({ success: true, snapshot });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});