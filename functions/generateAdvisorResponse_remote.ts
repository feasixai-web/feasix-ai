import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { videoId, chapterTimestamp, chapterTitle, chapterDescription, chapterPhase } = await req.json();

    if (!videoId || !chapterTimestamp) {
      return Response.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // Fetch video data
    const videos = await base44.entities.Video.filter({ id: videoId });
    if (videos.length === 0) {
      return Response.json({ error: 'Video not found' }, { status: 404 });
    }

    const video = videos[0];

    // Parse timestamp to seconds
    const parseTimestamp = (ts) => {
      const parts = ts.split(':').map(p => parseInt(p));
      if (parts.length === 2) return parts[0] * 60 + parts[1];
      if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
      return 0;
    };

    const chapterSeconds = parseTimestamp(chapterTimestamp);
    const windowStart = Math.max(0, chapterSeconds - 45);
    const windowEnd = chapterSeconds + 45;

    // Extract transcript segment
    let transcriptSegment = '';
    if (video.transcript && Array.isArray(video.transcript)) {
      const relevantSegments = video.transcript.filter(
        seg => seg.start >= windowStart && seg.start <= windowEnd
      );
      transcriptSegment = relevantSegments.map(seg => seg.text).join(' ');
    }

    // Build context from friction analysis
    let structuralContext = '';
    if (video.friction_analysis) {
      const analysis = video.friction_analysis;
      if (analysis.key_details) {
        structuralContext += `Key Details: ${JSON.stringify(analysis.key_details.slice(0, 3))}\n`;
      }
      if (analysis.nuances) {
        structuralContext += `Nuances: ${JSON.stringify(analysis.nuances.slice(0, 2))}\n`;
      }
    }

    // Generate advisory response
    const creatorName = video.channel || 'the creator';
    const prompt = `You are Feasix, an experienced venture advisor watching a business video with the user.

Use personal pronouns (I, you, they, ${creatorName}) and exclamations when appropriate to sound conversational and engaging.

Your job is to provide a short, direct insight that helps the user think more critically about what they're hearing.

CONTEXT:
Creator: ${creatorName}
Chapter: "${chapterTitle}"
Description: ${chapterDescription || 'N/A'}
Phase: ${chapterPhase || 'N/A'}
Timestamp: ${chapterTimestamp}

TRANSCRIPT SEGMENT (±45 seconds):
${transcriptSegment || 'No transcript available'}

STRUCTURAL ANALYSIS:
${structuralContext || 'No structural analysis available'}

RULES:
• Write ONLY 1–2 sentences
• Maximum 20 words
• Use personal pronouns: "you should," "they mention," "${creatorName} says," "I think"
• Use exclamations when pointing out something important
• Sound conversational and direct
• Do NOT summarize the section
• Focus on practical insights, assumptions, or critical observations

Tone Examples:
"${creatorName} made a great point! You should make sure to validate demand first."
"They're glossing over the hardest part here - customer acquisition."
"I think you'll need way more traffic than ${creatorName} is suggesting!"
"That's a key assumption! Most people underestimate the time this takes."

Respond with JSON only:
{
  "reasoning_type": "REALITY_CHECK" | "MISSING_CONTEXT" | "STRATEGIC_INSIGHT" | "CRITICAL_QUESTION",
  "message": "Your 1-2 sentence advisory message (20 words max)"
}`;

    const response = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          reasoning_type: {
            type: 'string',
            enum: ['REALITY_CHECK', 'MISSING_CONTEXT', 'STRATEGIC_INSIGHT', 'CRITICAL_QUESTION']
          },
          message: { type: 'string' }
        },
        required: ['reasoning_type', 'message']
      }
    });

    return Response.json({
      reasoning_type: response.reasoning_type,
      message: response.message,
      status: response.reasoning_type === 'REALITY_CHECK' || response.reasoning_type === 'MISSING_CONTEXT' ? 'warning' : 'normal'
    });

  } catch (error) {
    console.error('Error generating advisor response:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});