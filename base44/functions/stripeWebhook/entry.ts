import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@17.5.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));
const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  
  try {
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    const event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      webhookSecret
    );

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const userEmail = session.metadata.user_email || session.customer_email;

      // Find or create subscription record
      const existingSubs = await base44.asServiceRole.entities.Subscription.filter({ 
        created_by: userEmail 
      });

      if (existingSubs.length > 0) {
        await base44.asServiceRole.entities.Subscription.update(existingSubs[0].id, {
          tier: 'paid',
          subscription_start: new Date().toISOString()
        });
      } else {
        await base44.asServiceRole.entities.Subscription.create({
          tier: 'paid',
          subscription_start: new Date().toISOString(),
          created_by: userEmail
        });
      }
    } else if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object;
      const customer = await stripe.customers.retrieve(subscription.customer);
      const userEmail = customer.email;

      const existingSubs = await base44.asServiceRole.entities.Subscription.filter({ 
        created_by: userEmail 
      });

      if (existingSubs.length > 0) {
        await base44.asServiceRole.entities.Subscription.update(existingSubs[0].id, {
          tier: 'free'
        });
      }
    }

    return Response.json({ received: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }
});