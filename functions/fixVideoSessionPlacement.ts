import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get all sessions for this user
        const sessions = await base44.entities.AccumulationSession.filter({ created_by: user.email }, '-created_date');
        
        if (!sessions.length) {
            return Response.json({ message: 'No sessions found' });
        }

        // Find misplaced videos
         const fixes = [];

         for (const session of sessions) {
             const sessionType = session.session_type || 'general';
             const videosToRemove = [];

             // Check general_video_ids for misplaced videos (if session is specific)
             if (sessionType === 'specific' && session.general_video_ids?.length > 0) {
                 for (let i = 0; i < session.general_video_ids.length; i++) {
                     const videoId = session.general_video_ids[i];
                     const videoData = await base44.entities.Video.filter({ id: videoId }).then(v => v[0]);

                     if (videoData?.video_type === 'general') {
                         videosToRemove.push({ index: i, videoId, videoType: 'general', fromField: 'general_video_ids' });
                     }
                 }

                 // Remove from general_video_ids and move to General (Global)
                 if (videosToRemove.length > 0) {
                     const updatedIds = session.general_video_ids.filter((_, idx) => !videosToRemove.some(r => r.index === idx));
                     await base44.entities.AccumulationSession.update(session.id, {
                         general_video_ids: updatedIds
                     });

                     // Move to General (Global) session
                     let generalSession = await base44.entities.AccumulationSession.filter({
                         created_by: user.email,
                         genre: 'General (Global)',
                         session_type: 'general'
                     }).then(s => s[0] || base44.entities.AccumulationSession.create({
                         session_type: 'general',
                         genre: 'General (Global)',
                         general_video_ids: []
                     }));

                     const currentIds = generalSession.general_video_ids || [];
                     const newIds = [...currentIds, ...videosToRemove.map(r => r.videoId)];
                     await base44.entities.AccumulationSession.update(generalSession.id, {
                         general_video_ids: newIds
                     });

                     videosToRemove.forEach(v => {
                         fixes.push({
                             videoId: v.videoId,
                             fromSession: session.id,
                             toSession: generalSession.id,
                             videoType: 'general'
                         });
                     });
                 }
             }

             // Check accumulated_videos for misplaced videos (if session is general)
             videosToRemove = [];
             if (sessionType === 'general' && session.accumulated_videos?.length > 0) {
                 for (let i = 0; i < session.accumulated_videos.length; i++) {
                     const av = session.accumulated_videos[i];
                     const videoData = await base44.entities.Video.filter({ id: av.video_id }).then(v => v[0]);

                     if (!videoData) continue;
                     if (videoData.video_type === 'specific') {
                         videosToRemove.push({ index: i, videoId: av.video_id, videoType: 'specific', av });
                     }
                 }

                 // Remove from accumulated_videos and move to appropriate specific session
                 if (videosToRemove.length > 0) {
                     const updatedVideos = session.accumulated_videos.filter((_, idx) => !videosToRemove.some(r => r.index === idx));
                     await base44.entities.AccumulationSession.update(session.id, {
                         accumulated_videos: updatedVideos
                     });

                     for (const misplaced of videosToRemove) {
                         const videoData = await base44.entities.Video.filter({ id: misplaced.videoId }).then(v => v[0]);
                         const videoGenre = videoData?.genre || 'Other';

                         let specificSession = await base44.entities.AccumulationSession.filter({
                             created_by: user.email,
                             session_type: 'specific',
                             genre: videoGenre
                         }).then(s => s[0] || base44.entities.AccumulationSession.create({
                             session_type: 'specific',
                             genre: videoGenre,
                             accumulated_videos: []
                         }));

                         const updatedAccumulated = specificSession.accumulated_videos || [];
                         const nextOrder = updatedAccumulated.length + 1;
                         const newAv = {
                             video_id: misplaced.videoId,
                             order: nextOrder,
                             session_rating: 'watch',
                             session_rating_rationale: 'Auto-corrected from general session'
                         };

                         await base44.entities.AccumulationSession.update(specificSession.id, {
                             accumulated_videos: [...updatedAccumulated, newAv]
                         });

                         fixes.push({
                             videoId: misplaced.videoId,
                             fromSession: session.id,
                             toSession: specificSession.id,
                             videoType: 'specific'
                         });
                     }
                 }
             }
         }

        return Response.json({
            success: true,
            fixed: fixes.length,
            fixes: fixes
        });

    } catch (error) {
        console.error('Error:', error);
        return Response.json({ 
            error: error.message 
        }, { status: 500 });
    }
});