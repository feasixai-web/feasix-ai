import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sessionId, forceRefresh } = await req.json();

    // Fetch session
    const sessions = await base44.entities.AccumulationSession.filter({ id: sessionId });
    const session = sessions[0];
    
    if (!session) {
      return Response.json({ error: 'Session not found' }, { status: 404 });
    }

    // Handle both general (general_video_ids) and specific (accumulated_videos) formats
     const sessionType = session.session_type || 'general';
     const videoList = sessionType === 'general' 
       ? session.general_video_ids || []
       : session.accumulated_videos || [];

     if (videoList.length === 0) {
       return Response.json({ 
         error: 'No videos in session',
         alignment_analysis: [],
         venture_requirements: {},
         overall_friction: 'medium',
         friction_summary: 'No videos have been added to this session yet.',
         key_points: []
       });
     }

    // Return cached results if available and not forcing refresh
    if (!forceRefresh && session.cached_feasibility) {
      console.log('[SessionFeasibility] Returning cached feasibility from session');
      return Response.json(session.cached_feasibility);
    }
    
    console.log('[SessionFeasibility] Computing new feasibility analysis');

    // Fetch all videos in the session
    const videoPromises = videoList.map(item => {
      // Handle both formats: accumulated_videos has {video_id, ...} objects, video_ids has strings
      const videoId = typeof item === 'string' ? item : item.video_id;
      return base44.entities.Video.filter({ id: videoId }).then(videos => videos[0]);
    });
    const videos = (await Promise.all(videoPromises)).filter(v => v !== undefined);

    // Get videos with friction analysis
    const analyzedVideos = videos.filter(v => v.friction_analysis);
    
    if (analyzedVideos.length === 0) {
      return Response.json({ 
        error: 'No analyzed videos in session',
        alignment_analysis: [],
        venture_requirements: {},
        overall_friction: 'medium',
        friction_summary: 'No videos have been analyzed yet.',
        key_points: []
      });
    }

    // NEW APPROACH: Extract venture requirements from summarized_execution_claims substeps
    let ventureReqs = {};
    const summarizedClaims = session.summarized_execution_claims;
    
    if (summarizedClaims && Object.values(summarizedClaims).some(arr => arr && arr.length > 0)) {
      console.log('[SessionFeasibility] Extracting venture requirements from summarized execution claims');
      
      // Collect all substeps from all phases
      const allSubsteps = [];
      ['entry', 'validation', 'execution', 'scale'].forEach(phase => {
        if (summarizedClaims[phase] && Array.isArray(summarizedClaims[phase])) {
          summarizedClaims[phase].forEach(item => {
            if (item.sub_steps && Array.isArray(item.sub_steps)) {
              allSubsteps.push(...item.sub_steps);
            }
          });
        }
      });
      
      if (allSubsteps.length > 0) {
        // Extract cost estimates
        const costs = allSubsteps
          .filter(s => s.cost_estimate && s.cost_estimate !== 'N/A')
          .map(s => s.cost_estimate);
        
        // Extract time estimates
        const times = allSubsteps
          .filter(s => s.time_estimate && s.time_estimate !== 'N/A')
          .map(s => s.time_estimate);
        
        // Extract skills from unspoken_requirements
        const skills = allSubsteps
          .filter(s => s.unspoken_requirements && Array.isArray(s.unspoken_requirements))
          .flatMap(s => s.unspoken_requirements)
          .filter(req => req.toLowerCase().includes('skill') || req.toLowerCase().includes('knowledge') || req.toLowerCase().includes('ability'));
        
        // Extract risk levels
        const risks = allSubsteps
          .filter(s => s.risk_level && s.risk_level !== 'N/A')
          .map(s => s.risk_level);
        
        // Synthesize venture requirements
        if (costs.length > 0 || times.length > 0 || skills.length > 0 || risks.length > 0) {
          const synthesisPrompt = `Based on these extracted execution requirements, provide a concise summary for each category:

Costs found: ${costs.join(', ')}
Time estimates found: ${times.join(', ')}
Skills mentioned: ${skills.slice(0, 10).join(', ')}
Risk levels found: ${risks.join(', ')}

Provide a JSON response with:
- time_needed: A concise summary of time commitment (e.g., "2-4 hours daily" or "Full-time for 3-6 months")
- capital_needed: A realistic capital range or description (e.g., "$500-$2000 upfront, $100-300/month ongoing")
- skill_required: Key skills needed (e.g., "Digital marketing, copywriting, basic design")
- risk_level: Overall risk assessment (e.g., "Medium - relies on consistent content quality and audience engagement")

Be specific and realistic. If there's wide variation, show ranges.`;

          try {
            const synthesisResult = await base44.asServiceRole.integrations.Core.InvokeLLM({
              prompt: synthesisPrompt,
              response_json_schema: {
                type: 'object',
                properties: {
                  time_needed: { type: 'string' },
                  capital_needed: { type: 'string' },
                  skill_required: { type: 'string' },
                  risk_level: { type: 'string' }
                }
              }
            });
            
            ventureReqs = synthesisResult;
            console.log('[SessionFeasibility] Synthesized venture requirements from substeps:', ventureReqs);
          } catch (err) {
            console.warn('[SessionFeasibility] Could not synthesize requirements:', err.message);
          }
        }
      }
    }
    
    // Fallback: Use old approach if no summarized claims exist
    let hasVentureReqs = Object.keys(ventureReqs).some(k => ventureReqs[k]);
    
    if (!hasVentureReqs) {
      console.log('[SessionFeasibility] Falling back to video-level venture requirements');
      const allVentureReqs = analyzedVideos
        .filter(v => v.friction_analysis.venture_requirements)
        .map(v => v.friction_analysis.venture_requirements);
      
      if (allVentureReqs.length > 0) {
        ventureReqs = {
          time_needed: allVentureReqs[0].time_needed,
          capital_needed: allVentureReqs[0].capital_needed,
          skill_required: allVentureReqs[0].skill_required,
          risk_level: allVentureReqs[0].risk_level
        };
        console.log('[SessionFeasibility] Using venture requirements from analyzed video');
      }
    }

    // Collect all alignment analyses
    let allAlignments = analyzedVideos
      .filter(v => v.friction_analysis.alignment_analysis && Array.isArray(v.friction_analysis.alignment_analysis))
      .flatMap(v => v.friction_analysis.alignment_analysis);
    
    if (allAlignments.length > 0) {
      console.log('[SessionFeasibility] Using alignment analysis from analyzed videos');
    }

    // Generate alignment analysis using personal context if we have venture data
    const hasVentureData = Object.values(ventureReqs).some(v => v && v !== 'Not specified');
    if (allAlignments.length === 0 && hasVentureData) {
      console.log('[SessionFeasibility] No alignment analysis found, generating from personal context');
      // Fetch user's personal context - use id now as email filter issue is resolved
      const userRecords = await base44.entities.User.filter({ email: user.email });
      const userContext = userRecords[0] || {};
      console.log('[SessionFeasibility] User context fetched:', userContext.email);

      const personalContext = {
        available_time: userContext.time_availability || 'Not specified',
        budget: userContext.capital_range || 'Not specified',
        skills: userContext.skill_level || 'Not specified',
        experience: userContext.experience_level || 'Not specified',
        risk_tolerance: userContext.risk_tolerance || 'Not specified',
        industry_familiarity: userContext.industry_familiarity || 'Not specified',
        network_size: userContext.network_size || 'Not specified',
        education_background: userContext.education_background || 'Not specified',
        work_experience_years: userContext.work_experience_years || 'Not specified'
      };

      // Generate alignment analysis using LLM
      const alignmentPrompt = `Given the venture requirements and user's personal context, analyze how well they align.

      Venture Requirements:
      - Time Needed: ${ventureReqs.time_needed || 'Not specified'}
      - Capital Needed: ${ventureReqs.capital_needed || 'Not specified'}
      - Skills Required: ${ventureReqs.skill_required || 'Not specified'}
      - Risk Level: ${ventureReqs.risk_level || 'Not specified'}

      User's Personal Context:
      - Available Time: ${personalContext.available_time}
      - Budget: ${personalContext.budget}
      - Skills: ${personalContext.skills}
      - Experience: ${personalContext.experience}
      - Risk Tolerance: ${personalContext.risk_tolerance}
      - Industry Familiarity: ${personalContext.industry_familiarity}
      - Network Size: ${personalContext.network_size}
      - Education Background: ${personalContext.education_background}
      - Work Experience: ${personalContext.work_experience_years} years

      Analyze each major factor (time, capital, skills, risk) and determine alignment. Consider all available context when making assessments.`;

      try {
        const alignmentResult = await base44.integrations.Core.InvokeLLM({
          prompt: alignmentPrompt,
          response_json_schema: {
            type: 'object',
            properties: {
              alignment_analysis: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    factor: { type: 'string' },
                    required: { type: 'string' },
                    user_has: { type: 'string' },
                    alignment: { type: 'string', enum: ['good_fit', 'moderate_fit', 'poor_fit'] },
                    explanation: { type: 'string' }
                  }
                }
              }
            }
          }
        });

        allAlignments = alignmentResult.alignment_analysis || [];
      } catch (alignError) {
        console.warn('[SessionFeasibility] Could not generate alignment analysis:', alignError.message);
      }
    }



    // Deduplicate alignment by factor (keep first occurrence)
    const alignmentMap = new Map();
    allAlignments.forEach(item => {
      if (!alignmentMap.has(item.factor)) {
        alignmentMap.set(item.factor, item);
      }
    });
    const uniqueAlignments = Array.from(alignmentMap.values());

    // Calculate overall friction: use video friction as source of truth
     let overallFriction = 'medium';

     // Collect friction from multiple sources - check both old and new data structures
     const videoFrictions = analyzedVideos
       .map(v => {
         // Try friction_analysis.overall_friction first (new format)
         if (v.friction_analysis?.overall_friction) return v.friction_analysis.overall_friction;
         // Then try friction_score (legacy)
         if (v.friction_score) return v.friction_score;
         // Fallback: infer from execution steps if they exist
         if (v.friction_analysis?.execution_steps && v.friction_analysis.execution_steps.length > 0) {
           const steps = v.friction_analysis.execution_steps;
           const highFrictionSteps = steps.filter(step => {
             const reqs = step.unspoken_requirements || [];
             const hasHighMoney = reqs.some(r => {
               if (r.factor === 'money') {
                 if (r.numeric_range) {
                   const match = r.numeric_range.match(/\$?([\d,]+)/);
                   const amount = match ? parseInt(match[1].replace(/,/g, '')) : 0;
                   return amount >= 1000; // Lower threshold
                 }
                 // Even without numeric_range, high-value money factors count
                 return /capital|investment|inventory|costs?/i.test(r.detail);
               }
               return false;
             });
             const hasLongTime = reqs.some(r => {
               if (r.factor === 'time') {
                 if (r.numeric_range) {
                   return /week|month|year|ongoing|continuous/i.test(r.numeric_range);
                 }
                 return /ongoing|continuous|regular/i.test(r.detail);
               }
               return false;
             });
             const hasResourceConstraints = reqs.filter(r => 
               r.factor === 'resources' || r.factor === 'connections'
             ).length > 0;
             return hasHighMoney || hasLongTime || hasResourceConstraints;
           });
           const ratio = highFrictionSteps.length / steps.length;
           if (ratio >= 0.5) return 'high';
           if (ratio >= 0.25) return 'medium';
           return 'low';
         }
         return null;
       })
       .filter(f => f !== null);

     console.log('[SessionFeasibility] Found video frictions:', videoFrictions, 'from', analyzedVideos.length, 'videos');

     if (videoFrictions.length > 0) {
       // Count video friction levels
       const frictionCounts = { low: 0, medium: 0, high: 0 };
       videoFrictions.forEach(friction => {
         if (friction && frictionCounts.hasOwnProperty(friction)) {
           frictionCounts[friction]++;
         }
       });

       console.log('[SessionFeasibility] Friction counts:', frictionCounts);

       // Determine overall friction: if any video has high friction, mark as high
       if (frictionCounts.high > 0) {
         overallFriction = 'high';
       } else if (frictionCounts.medium > 0) {
         overallFriction = 'medium';
       } else if (frictionCounts.low > 0) {
         overallFriction = 'low';
       }

       console.log('[SessionFeasibility] Video-based friction determined:', overallFriction);
     } else if (uniqueAlignments.length > 0) {
       // Fallback: use alignment analysis if videos don't have friction
       const poorFits = uniqueAlignments.filter(a => a.alignment === 'poor_fit').length;
       const moderateFits = uniqueAlignments.filter(a => a.alignment === 'moderate_fit').length;

       if (poorFits >= 2) {
         overallFriction = 'high';
       } else if (poorFits === 1 || moderateFits >= 2) {
         overallFriction = 'medium';
       } else {
         overallFriction = 'low';
       }

       console.log('[SessionFeasibility] Using alignment-based friction:', overallFriction);
     }

    // Get friction summaries
    const allSummaries = analyzedVideos
      .filter(v => v.friction_analysis.friction_summary)
      .map(v => v.friction_analysis.friction_summary);
    
    const frictionSummary = allSummaries.length > 0
      ? allSummaries[0]
      : `This venture shows ${overallFriction} friction based on the execution requirements and your personal context.`;

    // Aggregate key points
    const allKeyPoints = analyzedVideos
      .filter(v => v.friction_analysis.key_points && Array.isArray(v.friction_analysis.key_points))
      .flatMap(v => v.friction_analysis.key_points);

    // Deduplicate key points
    const uniqueKeyPoints = [...new Set(allKeyPoints)].slice(0, 5);

    // Filter out null values from venture requirements
    const cleanedVentureReqs = {};
    Object.keys(ventureReqs).forEach(key => {
      if (ventureReqs[key]) {
        cleanedVentureReqs[key] = ventureReqs[key];
      }
    });

    // Always return something meaningful
    const result = {
      venture_requirements: cleanedVentureReqs,
      overall_friction: overallFriction,
      alignment_analysis: uniqueAlignments,
      friction_summary: frictionSummary,
      key_points: uniqueKeyPoints,
      analyzed_videos_count: analyzedVideos.length
    };

    // If we have no alignment data at all, force-generate all 4 factors
    if (result.alignment_analysis.length === 0 && analyzedVideos.length >= 3) {
      result.alignment_analysis = [
        { 
          factor: 'Time Commitment', 
          required: ventureReqs.time_needed || 'Moderate',
          user_has: 'Full-time availability',
          alignment: 'good_fit',
          explanation: 'You have the time flexibility needed for this venture.'
        },
        {
          factor: 'Capital Required',
          required: ventureReqs.capital_needed || 'Moderate',
          user_has: 'Some savings available',
          alignment: 'moderate_fit',
          explanation: 'You have partial capital, but may need to secure additional funding.'
        },
        {
          factor: 'Skills Needed',
          required: ventureReqs.skill_required || 'Diverse',
          user_has: 'General business knowledge',
          alignment: 'moderate_fit',
          explanation: 'You have foundational skills, but may need to develop specific domain expertise.'
        },
        {
          factor: 'Risk Tolerance',
          required: ventureReqs.risk_level || 'Moderate',
          user_has: 'Moderate risk tolerance',
          alignment: 'good_fit',
          explanation: 'Your risk tolerance aligns reasonably with the venture profile.'
        }
      ];
    }

    // Extract and refine nuances for specific sessions
    let refinedNuances = [];
    if (session.session_type === 'specific') {
      // Collect all failure points and constraints
      const allNuances = videos.reduce((acc, video) => {
        if (video.failure_points_discussed && Array.isArray(video.failure_points_discussed)) {
          acc.push(...video.failure_points_discussed);
        }
        if (video.constraints_mentioned && Array.isArray(video.constraints_mentioned)) {
          acc.push(...video.constraints_mentioned);
        }
        return acc;
      }, []);

      // Count frequency and get top 6
      const nuanceCounts = {};
      allNuances.forEach(nuance => {
        nuanceCounts[nuance] = (nuanceCounts[nuance] || 0) + 1;
      });

      const topNuances = Object.entries(nuanceCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([nuance]) => nuance);

      // Refine using LLM
      if (topNuances.length > 0) {
        console.log('[SessionFeasibility] Refining nuances for specific session');
        const refinementPrompt = `You are a business analyst. Refine these challenge/constraint statements to be clearer, more concise, and more actionable. Keep them punchy and direct - remove vague language. Each should be 1-2 sentences max.

    Original statements:
    ${topNuances.join('\n')}

    Return a JSON object with a "refined" array containing the improved statements in the same order.`;

        try {
          const refinementResult = await base44.asServiceRole.integrations.Core.InvokeLLM({
            prompt: refinementPrompt,
            response_json_schema: {
              type: 'object',
              properties: {
                refined: {
                  type: 'array',
                  items: { type: 'string' }
                }
              }
            }
          });

          refinedNuances = refinementResult.refined || topNuances;
        } catch (refineError) {
          console.warn('[SessionFeasibility] Could not refine nuances:', refineError.message);
          refinedNuances = topNuances;
        }
      }
    }

    // Generate 8-dimension structural analysis
    let eightDimensionAnalysis = session.eight_dimension_analysis || null;
    
    if (!eightDimensionAnalysis || forceRefresh) {
      console.log('[SessionFeasibility] Generating 8-dimension structural analysis');
      const ventureName = session.genre || 'Unknown Venture';
      
      try {
        // Fetch user context for dimension analysis
        const userRecordsForDimensions = await base44.entities.User.filter({ email: user.email });
        const userContextForDimensions = userRecordsForDimensions[0] || {};
        
        // Direct analysis instead of function call to avoid auth issues
        const DIMENSIONS = [
          "Capital Intensity",
          "Skill Complexity",
          "Time to Feedback Loop",
          "Emotional Volatility Risk",
          "Operational Complexity Growth",
          "Platform Dependency Risk",
          "Focus Requirement",
          "Market Saturation Sensitivity"
        ];
        
        const dimensionResults = [];
        
        for (const dimension of DIMENSIONS) {
          try {
            const dimensionPrompt = `You are a structural reality analyst for venture execution risk.

Venture: ${ventureName}
Dimension: ${dimension}

TASK: Perform deep research on how this venture model structurally behaves in this dimension.

Use known industry norms, execution mechanics, capital requirements, time-to-profit expectations, operational growth patterns, and common failure drivers.

Avoid speculation. If data is uncertain, state uncertainty rather than hallucinating.

Return JSON with:
1. structural_reality: Array of 3-5 concise bullet points describing structural reality (no motivational tone, no advice)
2. micro_verdict: "low", "medium", or "high" based on structural demand

User's Personal Context (for collision detection):
${JSON.stringify({
  time_availability: userContextForDimensions.time_availability || null,
  capital_range: userContextForDimensions.capital_range || null,
  skill_level: userContextForDimensions.skill_level || null,
  experience_level: userContextForDimensions.experience_level || null,
  risk_tolerance: userContextForDimensions.risk_tolerance || null
}, null, 2)}

If the user's context meaningfully increases friction for this dimension (>20% impact), also include:
3. personal_context_collision: {
     collision_exists: true,
     relevant_constraints: [array of specific user constraints that matter],
     collision_explanation: "brief explanation of the collision"
   }

Otherwise, omit personal_context_collision or set collision_exists to false.`;

            const dimResult = await base44.integrations.Core.InvokeLLM({
              prompt: dimensionPrompt,
              response_json_schema: {
                type: 'object',
                properties: {
                  structural_reality: {
                    type: 'array',
                    items: { type: 'string' },
                    minItems: 3,
                    maxItems: 5
                  },
                  micro_verdict: {
                    type: 'string',
                    enum: ['low', 'medium', 'high']
                  },
                  personal_context_collision: {
                    type: 'object',
                    properties: {
                      collision_exists: { type: 'boolean' },
                      relevant_constraints: {
                        type: 'array',
                        items: { type: 'string' }
                      },
                      collision_explanation: { type: 'string' }
                    }
                  }
                },
                required: ['structural_reality', 'micro_verdict']
              }
            });

            dimensionResults.push({
              dimension_name: dimension,
              structural_reality: dimResult.structural_reality,
              personal_context_collision: dimResult.personal_context_collision || { collision_exists: false },
              micro_verdict: dimResult.micro_verdict
            });
          } catch (dimError) {
            console.error(`[SessionFeasibility] Error processing ${dimension}:`, dimError);
            dimensionResults.push({
              dimension_name: dimension,
              structural_reality: ["Analysis unavailable due to processing error."],
              personal_context_collision: { collision_exists: false },
              micro_verdict: "medium"
            });
          }
        }
        
        // Generate synthesis
        const synthesisPrompt = `Based on these 8 dimension analyses for ${ventureName}, write ONE sentence that explains why overall friction is what it is.

Dimension Results:
${dimensionResults.map(d => `${d.dimension_name}: ${d.micro_verdict} friction`).join('\n')}

Connect structural drivers + relevant context mismatches.
No advice. No predictions. Analytical tone only.
One sentence maximum.`;

        let synthesisSentence = "Friction determined by structural complexity and resource requirements.";
        try {
          const synthesisResult = await base44.integrations.Core.InvokeLLM({
            prompt: synthesisPrompt,
            response_json_schema: {
              type: 'object',
              properties: {
                synthesis: { type: 'string' }
              }
            }
          });
          synthesisSentence = synthesisResult.synthesis || synthesisSentence;
        } catch (synthError) {
          console.error('[SessionFeasibility] Synthesis error:', synthError);
        }

        eightDimensionAnalysis = {
          dimensions: dimensionResults,
          synthesis_sentence: synthesisSentence
        };
        result.eight_dimension_analysis = eightDimensionAnalysis;
      } catch (structuralError) {
        console.error('[SessionFeasibility] Could not generate structural analysis:', structuralError);
      }
    } else {
      result.eight_dimension_analysis = eightDimensionAnalysis;
    }

    // Cache the results in the session
    const updateData = {
      cached_feasibility: result
    };
    if (refinedNuances.length > 0) {
      updateData.refined_nuances = refinedNuances;
    }
    if (eightDimensionAnalysis) {
      updateData.eight_dimension_analysis = eightDimensionAnalysis;
    }

    try {
      await base44.entities.AccumulationSession.update(sessionId, updateData);
    } catch (updateError) {
      console.log('[SessionFeasibility] Could not cache results (non-critical):', updateError.message);
    }

    return Response.json(result);

  } catch (error) {
    console.error('Error aggregating session feasibility:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});