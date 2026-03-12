import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all videos using raw query to avoid SDK validation issues
    const allVideos = await base44.asServiceRole.entities.Video.filter({});
    
    let updated = 0;
    let skipped = 0;
    
    // Update each video based on signal_density
    for (const video of allVideos) {
      try {
        const signalDensity = video.signal_density || 0;
        const newRating = signalDensity > 80 ? 'watch' : 'skim';
        
        // Only update if rating changed
        if (video.rating !== newRating) {
          // Create minimal update payload
          const updateData = {
            rating: newRating,
            rating_rationale: signalDensity > 80 
              ? 'High signal density (>80%)' 
              : 'Signal density ≤80%'
          };
          
          await base44.asServiceRole.entities.Video.update(video.id, updateData);
          updated++;
        } else {
          skipped++;
        }
      } catch (err) {
        console.error(`Failed to update video ${video.id}:`, err.message);
      }
    }
    
    return Response.json({ 
      success: true, 
      message: `Updated ${updated} videos, skipped ${skipped}`,
      total: allVideos.length,
      updated,
      skipped
    });
    
  } catch (error) {
    console.error('Error updating video ratings:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});