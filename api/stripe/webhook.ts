import { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
});

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Use service role key for admin operations
);

export const config = {
  api: {
    bodyParser: false, // Stripe requires raw body for webhook verification
  },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const signature = req.headers['stripe-signature'] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

  let event: Stripe.Event;

  try {
    // Get raw body
    const chunks = [];
    for await (const chunk of req as any) {
      chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
    }
    const rawBody = Buffer.concat(chunks);

    // Verify webhook signature
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (error: any) {
    console.error('Webhook signature verification failed:', error.message);
    return res.status(400).json({ error: 'Invalid signature' });
  }

  // Handle the event
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutComplete(session);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdate(subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionCanceled(subscription);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        console.log('Payment succeeded:', invoice.id);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentFailed(invoice);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return res.status(200).json({ received: true });
  } catch (error: any) {
    console.error('Webhook handler error:', error);
    return res.status(500).json({ error: 'Webhook handler failed' });
  }
}

async function handleCheckoutComplete(session: Stripe.Checkout.Session) {
  const tier = session.metadata?.tier || 'premium';
  const userId = session.metadata?.user_id;
  const customerId = session.customer as string | null;
  const subscriptionId = session.subscription as string | null;

  if (!userId) {
    console.error('No user_id found in session metadata');
    return;
  }

  if (!customerId || !subscriptionId) {
    console.error('Missing customer or subscription ID from checkout session', { customerId, subscriptionId });
    return;
  }

  // Fetch subscription details from Stripe to get accurate period_end
  let currentPeriodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    if ((subscription as any).current_period_end) {
      currentPeriodEnd = new Date((subscription as any).current_period_end * 1000).toISOString();
    }
  } catch (err) {
    console.warn('Failed to fetch subscription details from Stripe:', err);
  }

  // Create or update subscription record
  const { error } = await supabase
    .from('subscriptions')
    .upsert({
      user_id: userId,
      tier: tier,
      status: 'active',
      stripe_customer_id: customerId,
      stripe_subscription_id: subscriptionId,
      current_period_end: currentPeriodEnd,
    }, {
      onConflict: 'user_id'
    });

  if (error) {
    console.error('Failed to create subscription:', error);
  } else {
    console.log(`Subscription created for user ${userId}: ${tier}`);
  }
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  const updates: any = {
    status: subscription.status,
  };
  
  if ((subscription as any).current_period_end) {
    updates.current_period_end = new Date((subscription as any).current_period_end * 1000).toISOString();
  }

  const { error } = await supabase
    .from('subscriptions')
    .update(updates)
    .eq('stripe_subscription_id', subscription.id);

  if (error) {
    console.error('Failed to update subscription:', error);
  }
}

async function handleSubscriptionCanceled(subscription: Stripe.Subscription) {
  const { error } = await supabase
    .from('subscriptions')
    .update({
      status: 'canceled',
      tier: 'free',
    })
    .eq('stripe_subscription_id', subscription.id);

  if (error) {
    console.error('Failed to cancel subscript_idion:', error);
  }
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  // Handle both subscription_id and lines for invoice items that belong to subscription
  let subscriptionId: string | null = null;
  
  if ((invoice as any).subscription_id) {
    subscriptionId = (invoice as any).subscription_id as string;
  } else if (invoice.lines?.data?.[0]?.subscription) {
    subscriptionId = invoice.lines.data[0].subscription as string;
  }
  
  if (!subscriptionId) {
    console.log('No subscription ID in invoice');
    return;
  }

  const { error } = await supabase
    .from('subscriptions')
    .update({
      status: 'past_due',
    })
    .eq('stripe_subscription_id', subscriptionId);

  if (error) {
    console.error('Failed to update payment status:', error);
  }
}
