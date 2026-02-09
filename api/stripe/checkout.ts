import { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-01-28.clover',
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { tier, paymentMethod, userId, returnTo } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Define price IDs for each tier
    const priceIds = {
      premium: process.env.STRIPE_PRICE_ID_PREMIUM!,
      pro: process.env.STRIPE_PRICE_ID_PRO!,
    };

    const priceId = priceIds[tier as keyof typeof priceIds];
    
    if (!priceId) {
      return res.status(400).json({ error: 'Invalid tier' });
    }

    // Determine frontend base URL - use request headers to determine the origin
    let frontendUrl = process.env.FRONTEND_URL || 'http://localhost:8080';
    
    // If running on Vercel with request headers, try to get the real origin
    if (req.headers['x-forwarded-proto'] && req.headers['x-forwarded-host']) {
      frontendUrl = `${req.headers['x-forwarded-proto']}://${req.headers['x-forwarded-host']}`;
    } else if (req.headers.referer) {
      // Extract origin from referer header
      try {
        const refererUrl = new URL(req.headers.referer);
        frontendUrl = `${refererUrl.protocol}//${refererUrl.host}`;
      } catch (e) {
        // Use default if referer is invalid
      }
    }

    // Determine success URL based on returnTo parameter
    const successPath = returnTo || '/dashboard';
    const successUrl = new URL(frontendUrl);
    successUrl.pathname = successPath;
    successUrl.searchParams.set('success', 'true');
    successUrl.searchParams.set('session_id', '{CHECKOUT_SESSION_ID}');

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
      success_url: successUrl.toString(),
      cancel_url: `${frontendUrl}/pricing?canceled=true`,
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
