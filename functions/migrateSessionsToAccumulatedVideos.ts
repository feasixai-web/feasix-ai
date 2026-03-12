import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        // Only allow admins to run migrations
        if (!user || user.role !== 'admin') {
            return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
        }

        // Fetch all sessions
        const allSessions = await base44.asServiceRole.entities.AccumulationSession.list();
        
        let migrated = 0;
        let skipped = 0;
        const errors = [];

        for (const session of allSessions) {
            try {
                // Skip if already migrated
                if (session.accumulated_videos && session.accumulated_videos.length > 0) {
                    skipped++;
                    continue;
                }

                // Skip if no video_ids to migrate
                if (!session.video_ids || session.video_ids.length === 0) {
                    skipped++;
                    continue;
                }

                // Build accumulated_videos from video_ids
                const accumulatedVideos = [];
                for (let idx = 0; idx < session.video_ids.length; idx++) {
                    const videoId = session.video_ids[idx];
                    const videos = await base44.asServiceRole.entities.Video.filter({ id: videoId });
                    const video = videos[0];

                    if (video) {
                        accumulatedVideos.push({
                            video_id: videoId,
                            order: idx + 1,
                            session_rating: video.rating || 'watch',
                            session_rating_rationale: video.rating_rationale || 'Migrated from global rating'
                        });
                    }
                }

                // Update the session
                await base44.asServiceRole.entities.AccumulationSession.update(session.id, {
                    accumulated_videos: accumulatedVideos
                });

                migrated++;
            } catch (error) {
                errors.push({
                    sessionId: session.id,
                    error: error.message
                });
            }
        }

        return Response.json({
            success: true,
            migrated,
            skipped,
            errors,
            totalProcessed: migrated + skipped
        });

    } catch (error) {
        console.error('Migration error:', error);
        return Response.json({ 
            error: error.message 
        }, { status: 500 });
    }
});