import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { subject, message } = await req.json();

    if (!subject || !message) {
      return Response.json({ error: 'Subject and message are required' }, { status: 400 });
    }

    // Send email notification
    await base44.asServiceRole.integrations.Core.SendEmail({
      to: 'support@feasix.com', // Replace with your support email
      subject: `Contact Form: ${subject}`,
      body: `
From: ${user.full_name || 'User'} (${user.email})

Subject: ${subject}

Message:
${message}
      `
    });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});