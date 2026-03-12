import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Fetch all user's videos that have transcripts
        const allVideos = await base44.entities.Video.filter({ 
            created_by: user.email,
            has_transcript: true 
        });

        console.log(`Re-evaluating ${allVideos.length} videos with new strict rating logic...`);

        const results = [];

        for (const video of allVideos) {
            const oldRating = video.rating;

            // Re-analyze with the new stricter prompt (via analyzeVideoWithTranscript)
            // Since we don't have the original transcript stored, we'll re-evaluate based on existing data
            
            // Build a prompt using existing analysis data
            const reEvalPrompt = `
Re-evaluate this video's rating using STRICT criteria that FAVORS SKIM as the default.

Video: "${video.title}"
Current Rating: ${video.rating}
Signal Density: ${video.signal_density}
Key Points: ${(video.key_points || []).join('; ')}
Execution Claims (Entry): ${video.friction_analysis?.execution_claims?.entry?.sub_points ? video.friction_analysis.execution_claims.entry.sub_points.join('; ') : 'None'}
Execution Claims (Execution): ${video.friction_analysis?.execution_claims?.execution?.sub_points ? video.friction_analysis.execution_claims.execution.sub_points.join('; ') : 'None'}
Nuances: ${(video.friction_analysis?.nuances || []).join('; ')}

STRICT RATING LOGIC:
- WATCH: ONLY if signal_density ≥85 AND has 8+ specific actionable steps WITH concrete examples AND unique insights not commonly discussed. This is RARE (reserve for top 10-15% of content).
- SKIM: DEFAULT. Use for signal_density 40-84 OR any video with 2-7 steps OR useful but not exceptional content. MOST videos should get this.
- SKIP: signal_density <40 OR fewer than 2 concrete steps OR entirely generic advice.

Apply the NEW strict logic. What should the rating be?
`;

            const newRatingAnalysis = await base44.asServiceRole.integrations.Core.InvokeLLM({
                prompt: reEvalPrompt,
                response_json_schema: {
                    type: "object",
                    properties: {
                        new_rating: { type: "string", enum: ["skip", "skim", "watch"] },
                        rationale: { type: "string" }
                    }
                }
            });

            const newRating = newRatingAnalysis.new_rating;

            // Update the video if rating changed
            if (newRating !== oldRating) {
                // Fetch fresh video data to ensure we have all fields
                const currentVideo = await base44.entities.Video.filter({ id: video.id });
                const freshData = currentVideo[0];
                
                // Only update rating fields, preserve everything else exactly as-is
                await base44.asServiceRole.entities.Video.update(video.id, {
                    ...freshData,
                    rating: newRating,
                    rating_rationale: newRatingAnalysis.rationale
                });
            }

            results.push({
                video_id: video.id,
                title: video.title,
                old_rating: oldRating,
                new_rating: newRating,
                changed: newRating !== oldRating,
                rationale: newRatingAnalysis.rationale
            });
        }

        // Count distribution
        const distribution = {
            watch: results.filter(r => r.new_rating === 'watch').length,
            skim: results.filter(r => r.new_rating === 'skim').length,
            skip: results.filter(r => r.new_rating === 'skip').length
        };

        return Response.json({
            success: true,
            total_videos: allVideos.length,
            changes_made: results.filter(r => r.changed).length,
            distribution,
            results
        });

    } catch (error) {
        console.error('Error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});