import { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2026-01-28.clover',
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check if required environment variables are set
  if (!process.env.STRIPE_SECRET_KEY) {
    console.error('Missing STRIPE_SECRET_KEY environment variable');
    return res.status(500).json({ error: 'Server configuration error: Missing Stripe API key' });
  }

  try {
    const { tier, paymentMethod, userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Define price IDs for each tier
    const priceIds = {
      premium: process.env.STRIPE_PRICE_ID_PREMIUM,
      pro: process.env.STRIPE_PRICE_ID_PRO,
    };

    const priceId = priceIds[tier as keyof typeof priceIds];
    
    if (!priceId) {
      console.error(`Missing price ID for tier: ${tier}. Premium: ${process.env.STRIPE_PRICE_ID_PREMIUM}, Pro: ${process.env.STRIPE_PRICE_ID_PRO}`);
      return res.status(400).json({ error: `Server configuration error: Price not configured for ${tier} tier` });
    }

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: getPaymentMethodTypes(paymentMethod),
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.FRONTEND_URL || 'http://localhost:8080'}/dashboard?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:8080'}/pricing?canceled=true`,
      metadata: {
        tier: tier,
        user_id: userId,
      },
    });

    if (!session.url) {
      return res.status(500).json({ error: 'Failed to generate checkout URL' });
    }

    return res.status(200).json({ url: session.url });
  } catch (error: any) {
    console.error('Stripe checkout error:', error);
    console.error('Error message:', error.message);
    console.error('Error type:', error.type);
    console.error('Error param:', error.param);
    
    // If it's a Stripe-specific error, provide more details
    if (error.type === 'StripeInvalidRequestError') {
      return res.status(400).json({ 
        error: `Stripe validation error: ${error.message}`,
        details: error.param ? `Invalid parameter: ${error.param}` : error.message
      });
    }
    
    return res.status(500).json({ 
      error: 'Failed to create checkout session',
      message: error.message 
    });
  }
}

function getPaymentMethodTypes(method: string): Stripe.Checkout.SessionCreateParams.PaymentMethodType[] {
  switch (method) {
    case 'card':
      return ['card'];
    case 'paypal':
      return ['paypal'];
    case 'sepa':
      return ['sepa_debit'];
    case 'sofort':
      return ['sofort'];
    default:
      return ['card'];
  }
}
