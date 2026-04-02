import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useToast } from './use-toast';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook to show success message after Stripe payment redirect
 * Updates Supabase subscription tier directly (fallback if webhook fails)
 */
export function usePaymentSuccess() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const success = searchParams.get('success');
    const sessionId = searchParams.get('session_id');
    let tier = searchParams.get('tier');

    console.log('=== usePaymentSuccess ===');
    console.log('URL:', window.location.href);
    console.log('Params:', { success, sessionId, tier, isUpdating });

    // Fallback: get tier from sessionStorage
    if (!tier) {
      try {
        const pending = JSON.parse(sessionStorage.getItem('pending_tier_upgrade') || '{}');
        if (pending.tier) {
          tier = pending.tier;
          console.log('Got tier from sessionStorage:', tier);
        }
      } catch (e) {
        // ignore
      }
    }

    if (success === 'true' && !isUpdating && tier) {
      console.log('>>> TRIGGERING payment success handler, tier:', tier);
      handlePaymentSuccess(tier);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  async function handlePaymentSuccess(tier: string) {
    setIsUpdating(true);
    
    try {
      // Wait a moment for auth session to be restored after Stripe redirect
      await new Promise(resolve => setTimeout(resolve, 500));

      const { data: { session } } = await supabase.auth.getSession();
      console.log('Auth session exists:', !!session);
      
      if (!session) {
        console.error('No auth session - user may need to log in again');
        // Try to update via the API endpoint instead (uses service role key)
        await updateViaApi(tier);
        return;
      }

      const userId = session.user.id;
      console.log('User ID:', userId);

      // Step 1: Check current subscription
      const { data: existing, error: fetchError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .single();

      console.log('Current subscription:', existing, 'Error:', fetchError);

      // Step 2: Update the subscription
      let updateResult;
      
      if (existing) {
        // UPDATE existing row
        updateResult = await supabase
          .from('subscriptions')
          .update({
            tier: tier,
            status: 'active',
          })
          .eq('user_id', userId)
          .select();
      } else {
        // INSERT new row (user has no subscription yet)
        updateResult = await supabase
          .from('subscriptions')
          .insert({
            user_id: userId,
            tier: tier,
            status: 'active',
          })
          .select();
      }

      console.log('Update result:', updateResult.data, 'Error:', updateResult.error);

      if (updateResult.error) {
        console.error('Direct update failed, trying API fallback...');
        await updateViaApi(tier, userId);
      } else {
        console.log('Subscription updated to', tier, '!');
      }

      // Show success toast
      const tierName = tier.charAt(0).toUpperCase() + tier.slice(1);
      toast({
        title: '🎉 Subscription activated!',
        description: `You now have full access to ${tierName} features. Enjoy!`,
      });

      // Clear sessionStorage
      sessionStorage.removeItem('pending_tier_upgrade');

      // Remove params from URL
      setTimeout(() => {
        const params = new URLSearchParams(searchParams);
        params.delete('success');
        params.delete('session_id');
        params.delete('tier');
        setSearchParams(params);
        // Force reload to refresh subscription state everywhere
        window.location.reload();
      }, 1000);

    } catch (error) {
      console.error('Payment success error:', error);
      toast({
        title: 'Subscription activated!',
        description: 'Your payment was successful. Please refresh the page.',
      });
    } finally {
      setIsUpdating(false);
    }
  }

  // Fallback: Use the API endpoint which has service_role access
  async function updateViaApi(tier: string, userId?: string) {
    try {
      let uid = userId;
      if (!uid) {
        const user = (await supabase.auth.getSession()).data.session?.user ?? null;
        uid = user?.id;
      }
      
      if (!uid) {
        console.error('Cannot update: no user ID available');
        return;
      }

      console.log('Calling API fallback to update subscription...');
      const response = await fetch('/api/stripe/update-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: uid, tier }),
      });
      
      const result = await response.json();
      console.log('API update result:', result);
    } catch (err) {
      console.error('API fallback also failed:', err);
    }
  }
}
