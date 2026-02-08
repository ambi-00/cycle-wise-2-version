import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, tier } = req.body;

    if (!userId || !tier) {
      return res.status(400).json({ error: 'userId and tier are required' });
    }

    // Validate tier
    if (!['free', 'premium', 'pro'].includes(tier)) {
      return res.status(400).json({ error: 'Invalid tier' });
    }

    // Check if user exists
    const { data: user, error: userError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update subscription tier
    const { error } = await supabase
      .from('subscriptions')
      .update({
        tier: tier,
        status: 'active',
      })
      .eq('user_id', userId);

    if (error) {
      return res.status(500).json({ error: 'Failed to update subscription', details: error });
    }

    return res.status(200).json({ 
      success: true, 
      message: `Subscription updated to ${tier} for user ${userId}` 
    });
  } catch (error: any) {
    console.error('Update subscription error:', error);
    return res.status(500).json({ error: 'Failed to update subscription' });
  }
}
