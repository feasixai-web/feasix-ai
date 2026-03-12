import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { allPhases, sessionId } = await req.json();

    if (!allPhases || typeof allPhases !== 'object') {
      return Response.json({ error: 'Invalid request format' }, { status: 400 });
    }

    const results = {};

    // Process all phases in one go
    for (const [phase, claims] of Object.entries(allPhases)) {
      if (!claims || !Array.isArray(claims) || claims.length === 0) {
        results[phase] = [];
        continue;
      }

      try {
        // Single LLM call for both summarization AND substep generation
        const analysisResult = await base44.integrations.Core.InvokeLLM({
          prompt: `
You are analyzing execution claims from multiple videos about the same business venture.

Phase: ${phase}
Raw claims from videos:
${claims.map((c, i) => `${i + 1}. "${c}"`).join('\n')}

Your task:
1. Group semantically similar claims together (even if worded differently)
2. For each group, create ONE representative summary statement
3. Filter out vague or non-actionable claims (e.g., "success is important", "you need to work hard")
4. Count how many original claims map to each representative statement
5. For EACH representative statement, break it down into 3-5 detailed, actionable substeps

For each substep, provide:
- text: The substep description
- simplified_explanation: 1-2 sentences in simple language
- unspoken_requirements: Array of skills, money, time, resources, connections needed
- nuances: Array of critical "make-or-break" factors
- challenge_level: "easy", "medium", or "hard"
- cost_estimate: e.g., "$500", "$1k-$2k", "$0", "varies"
- time_estimate: e.g., "3 hours", "1-2 days", "1 week", "ongoing"
- risk_level: e.g., "Low", "Medium", "High", "Very High"

Rules:
- If 5 claims say essentially the same thing, create 1 representative with count=5
- Keep claims specific and actionable
- Remove obvious/vague statements
- Focus on concrete advice, steps, or insights
- Each substep must be concrete and actionable
`,
          response_json_schema: {
            type: "object",
            properties: {
              summarized_claims: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    representative: { type: "string" },
                    count: { type: "number" },
                    sub_steps: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          text: { type: "string" },
                          simplified_explanation: { type: "string" },
                          unspoken_requirements: { type: "array", items: { type: "string" } },
                          nuances: { type: "array", items: { type: "string" } },
                          challenge_level: { type: "string", enum: ["easy", "medium", "hard"] },
                          cost_estimate: { type: "string" },
                          time_estimate: { type: "string" },
                          risk_level: { type: "string" }
                        },
                        required: ["text", "simplified_explanation"]
                      }
                    }
                  },
                  required: ["representative", "count", "sub_steps"]
                }
              }
            }
          }
        });

        results[phase] = analysisResult.summarized_claims || [];
      } catch (error) {
        console.error(`Error processing phase ${phase}:`, error);
        results[phase] = [];
      }
    }

    return Response.json(results);

  } catch (error) {
    console.error('Error summarizing claims:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});