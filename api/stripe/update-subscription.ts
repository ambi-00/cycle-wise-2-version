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

    // Service role key bypasses RLS
    // First try update, if no rows affected, do insert
    const { data: updateData, error: updateError } = await supabase
      .from('subscriptions')
      .update({
        tier: tier,
        status: 'active',
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .select();

    if (updateError) {
      console.error('Update failed:', updateError);
      return res.status(500).json({ error: updateError.message });
    }

    // If update returned no rows, the user has no subscription row yet → insert
    if (!updateData || updateData.length === 0) {
      console.log('No existing row, inserting new subscription for user:', userId);
      const { data: insertData, error: insertError } = await supabase
        .from('subscriptions')
        .insert({
          user_id: userId,
          tier: tier,
          status: 'active',
        })
        .select();

      if (insertError) {
        console.error('Insert failed:', insertError);
        return res.status(500).json({ error: insertError.message });
      }
      return res.status(200).json({ success: true, data: insertData });
    }

    return res.status(200).json({ success: true, data: updateData });

  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
