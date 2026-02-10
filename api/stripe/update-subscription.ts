import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

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
      return res.status(400).json({ error: 'Missing userId or tier' });
    }

    if (!['free', 'premium', 'pro'].includes(tier)) {
      return res.status(400).json({ error: 'Invalid tier' });
    }

    const { data, error } = await supabase
      .from('subscriptions')
      .upsert({
        user_id: userId,
        tier: tier,
        status: 'active',
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id'
      })
      .select();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ success: true, data });

  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
