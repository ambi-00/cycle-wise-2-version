import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Fetch all users with their subscription info
    const { data, error } = await supabase
      .from('subscriptions')
      .select(`
        id,
        user_id,
        tier,
        status,
        stripe_customer_id,
        stripe_subscription_id,
        current_period_end,
        profiles:user_id(id, email, full_name)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch subscriptions', details: error });
    }

    // Transform data for easier reading
    const subscriptions = data?.map((sub: any) => ({
      id: sub.id,
      userId: sub.user_id,
      tier: sub.tier,
      status: sub.status,
      email: sub.profiles?.email || 'N/A',
      fullName: sub.profiles?.full_name || 'N/A',
      stripeCustomerId: sub.stripe_customer_id,
      stripeSubscriptionId: sub.stripe_subscription_id,
      currentPeriodEnd: sub.current_period_end,
    })) || [];

    return res.status(200).json({
      success: true,
      count: subscriptions.length,
      subscriptions,
    });
  } catch (error: any) {
    console.error('Fetch subscriptions error:', error);
    return res.status(500).json({ error: 'Failed to fetch subscriptions' });
  }
}
