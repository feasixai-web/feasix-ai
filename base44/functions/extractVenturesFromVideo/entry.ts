import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { videoId } = await req.json();

    if (!videoId) {
      return Response.json({ error: 'videoId is required' }, { status: 400 });
    }

    // Get video data
    const videos = await base44.entities.Video.filter({ id: videoId });
    const video = videos[0];

    if (!video) {
      return Response.json({ error: 'Video not found' }, { status: 404 });
    }

    // Check for transcript data - use either transcript or ordered_statements
    let transcriptText = '';

    if (video.transcript && video.transcript.length > 0) {
      transcriptText = video.transcript.map(item => item.text).join(' ');
    } else if (video.ordered_statements && video.ordered_statements.length > 0) {
      transcriptText = video.ordered_statements.map(item => `[${item.timestamp}] ${item.statement}`).join(' ');
    }

    if (!transcriptText || transcriptText.trim().length === 0) {
      return Response.json({ 
        error: 'No transcript or statements available',
        ventures: []
      }, { status: 200 });
    }

    // Get user personal context
    const personal_context_string = user ? (
      `User's personal context:\n` +
      `- Time Availability: ${user.time_availability || 'Not specified'}\n` +
      `- Capital Range: ${user.capital_range || 'Not specified'}\n` +
      `- Skill Level: ${user.skill_level || 'Not specified'}\n` +
      `- Risk Tolerance: ${user.risk_tolerance || 'Not specified'}\n` +
      `- Schedule Predictability: ${user.schedule_predictability || 'Not specified'}\n` +
      `- Mental Energy: ${user.mental_energy || 'Not specified'}\n` +
      `- Environment Support: ${user.environment_support || 'Not specified'}\n` +
      `- Dependents: ${user.dependents || 'Not specified'}\n` +
      `- Income Urgency: ${user.income_urgency || 'Not specified'}\n` +
      `- Primary Life Load: ${user.primary_life_load || 'Not specified'}`
    ) : 'User personal context not available.';

    // Use LLM directly to extract ventures with requirements and alignment
    const prompt = `
    VENTURE EXTRACTION FOR SIDE HUSTLES (WITH REQUIREMENTS & ALIGNMENT)

    Video Title: "${video.title}"

    CONTEXT: This is a side hustle video where multiple income-generating opportunities are presented to viewers.

    YOUR TASK: Extract ALL side hustles or ventures mentioned in the video, even if briefly discussed. For each venture, also infer the requirements and analyze alignment with the user's personal context.

    CRITICAL RULES:
    1. Extract EVERY distinct side hustle, business model, or income-generating activity mentioned
    2. For EACH venture, provide a verbatim evidence_quote from the transcript (even if short)
    3. Read the transcript sequentially and list ventures in the order they first appear
    4. Include ventures even if they're only explained for 30-60 seconds
    5. If the video title says "6 side hustles" or "7 ventures", you should find approximately that many

    WHAT COUNTS AS A VENTURE:
    - Any specific business model or income-generating activity that the viewer could pursue
    - Side hustles that are named and given at least a brief explanation
    - Activities where someone can earn money, even if details are limited
    - Examples: "Field Inspector", "Freelancing", "Photo Organizing", "YouTube", "Home Service Arbitrage"

    WHAT DOES NOT COUNT:
    - Pure sponsorship mentions without explaining the business model
    - Generic advice like "work hard" or "save money"
    - Tools mentioned only as resources (unless the business model around them is explained)

    EXTRACTION APPROACH:
    - Look for numbered lists, transitions like "next is...", "another one is...", or "number 3..."
    - Even if a venture gets 1-2 sentences, include it
    - If you find a quote that shows a venture is discussed, that's enough evidence
    - Look for statements that describe creating, selling, or building something for income
    - Check for business models involving digital products, communities, courses, or content creation

    TRANSCRIPT:
    ${transcriptText}

    ${personal_context_string}

    Extract ALL ventures in the order they appear. For each venture provide:
    
    1. venture_name: Clear, specific name (e.g., "Field Inspector", "YouTube Ad Revenue")
    2. evidence_quote: Any verbatim quote from transcript that proves this venture is discussed
    3. venture_summary: Brief 1-2 sentence summary of what it involves
    4. venture_requirements: Object with:
       - time_needed: Estimate (e.g., "5-10 hours/week", "20+ hours/week")
       - capital_needed: Estimate (e.g., "$0-100", "$500-2000", "$5000+")
       - skill_required: Brief description (e.g., "Basic writing skills", "Technical knowledge required")
       - risk_level: "low", "medium", or "high"
    5. alignment_analysis: Array of 3-5 objects analyzing fit with user's context:
       - factor: The personal context factor being analyzed (e.g., "Time Availability", "Capital Range")
       - alignment: "good_fit", "moderate_fit", or "poor_fit"
       - required: What the venture requires for this factor
       - user_has: What the user currently has (from personal context)
       - explanation: 1-2 sentence explanation of the match/mismatch

    IMPORTANT: 
    - If the video title mentions a specific number of hustles/ventures, aim to find that many or close to it.
    - Make reasonable inferences for requirements based on the venture description
    - For alignment_analysis, focus on the most relevant factors (time, capital, skills, risk tolerance)
    `;

    const analysis = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          signal_density: {
            type: "number",
            description: "0-100 score of actionable information density in this video"
          },
          friction_rationale: {
            type: "string",
            description: "Brief explanation of the overall complexity/difficulty of ventures presented"
          },
          ventures: {
            type: "array",
            items: {
              type: "object",
              properties: {
                venture_name: { type: "string" },
                evidence_quote: { type: "string" },
                venture_summary: { type: "string" },
                venture_requirements: {
                  type: "object",
                  properties: {
                    time_needed: { type: "string" },
                    capital_needed: { type: "string" },
                    skill_required: { type: "string" },
                    risk_level: { type: "string" }
                  }
                },
                alignment_analysis: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      factor: { type: "string" },
                      alignment: { type: "string" },
                      required: { type: "string" },
                      user_has: { type: "string" },
                      explanation: { type: "string" }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    const ventures = analysis?.ventures || [];

    return Response.json({
      success: true,
      signal_density: analysis?.signal_density || 0,
      friction_rationale: analysis?.friction_rationale || '',
      ventures: ventures
    });

  } catch (error) {
    console.error('Venture extraction error:', error);
    return Response.json({ 
      error: error.message,
      ventures: []
    }, { status: 500 });
  }
});