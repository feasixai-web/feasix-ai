import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

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

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { ventureName, sessionId } = await req.json();
    
    if (!ventureName) {
      return Response.json({ error: 'ventureName is required' }, { status: 400 });
    }

    // Fetch user's personal context
    const userRecords = await base44.entities.User.filter({ email: user.email });
    const userContext = userRecords[0] || {};

    const personalContext = {
      time_availability: userContext.time_availability || null,
      capital_range: userContext.capital_range || null,
      skill_level: userContext.skill_level || null,
      experience_level: userContext.experience_level || null,
      risk_tolerance: userContext.risk_tolerance || null,
      industry_familiarity: userContext.industry_familiarity || null,
      network_size: userContext.network_size || null,
      education_background: userContext.education_background || null,
      work_experience_years: userContext.work_experience_years || null,
      current_employment_status: userContext.current_employment_status || null,
      family_responsibilities: userContext.family_responsibilities || null,
      location_constraints: userContext.location_constraints || null
    };

    console.log(`[StructuralFeasibility] Analyzing ${ventureName} with 8 dimensions`);

    // Analyze each dimension
    const dimensionResults = [];
    
    for (const dimension of DIMENSIONS) {
      console.log(`[StructuralFeasibility] Processing dimension: ${dimension}`);
      
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
${JSON.stringify(personalContext, null, 2)}

If the user's context meaningfully increases friction for this dimension (>20% impact), also include:
3. personal_context_collision: {
     collision_exists: true,
     relevant_constraints: [array of specific user constraints that matter],
     collision_explanation: "brief explanation of the collision"
   }

Otherwise, omit personal_context_collision or set collision_exists to false.`;

      try {
        const result = await base44.integrations.Core.InvokeLLM({
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
          structural_reality: result.structural_reality,
          personal_context_collision: result.personal_context_collision || { collision_exists: false },
          micro_verdict: result.micro_verdict
        });
      } catch (error) {
        console.error(`[StructuralFeasibility] Error processing ${dimension}:`, error);
        // Add a fallback dimension result
        dimensionResults.push({
          dimension_name: dimension,
          structural_reality: ["Analysis unavailable due to processing error."],
          personal_context_collision: { collision_exists: false },
          micro_verdict: "medium"
        });
      }
    }

    // Generate synthesis sentence
    console.log(`[StructuralFeasibility] Generating synthesis`);
    
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
    } catch (error) {
      console.error('[StructuralFeasibility] Synthesis error:', error);
    }

    const analysis = {
      dimensions: dimensionResults,
      synthesis_sentence: synthesisSentence
    };

    // Cache result if sessionId provided
    if (sessionId) {
      try {
        await base44.entities.AccumulationSession.update(sessionId, {
          eight_dimension_analysis: analysis
        });
        console.log(`[StructuralFeasibility] Cached analysis to session ${sessionId}`);
      } catch (cacheError) {
        console.warn('[StructuralFeasibility] Could not cache to session:', cacheError);
      }
    }

    return Response.json({
      success: true,
      analysis
    });

  } catch (error) {
    console.error('[StructuralFeasibility] Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});