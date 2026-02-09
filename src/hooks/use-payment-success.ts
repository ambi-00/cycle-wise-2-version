import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useToast } from './use-toast';
import { useSubscription } from './use-subscription';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook to show success message after Stripe payment redirect
 * Also updates Supabase with the new subscription tier (as fallback if webhook fails)
 */
export function usePaymentSuccess() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const { subscription, refresh } = useSubscription();
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const success = searchParams.get('success');
    const sessionId = searchParams.get('session_id');
    let tier = searchParams.get('tier');

    console.log('usePaymentSuccess hook - checking params:', { success, sessionId, tier, isUpdating });

    // Fallback: If tier is not in URL, try to get it from sessionStorage
    if (!tier) {
      try {
        const pending = JSON.parse(sessionStorage.getItem('pending_tier_upgrade') || '{}');
        if (pending.tier) {
          tier = pending.tier;
          console.log('Retrieved tier from sessionStorage:', tier);
        }
      } catch (e) {
        console.error('Failed to parse sessionStorage:', e);
      }
    }

    if (success === 'true' && sessionId && !isUpdating) {
      console.log('Handling payment success with tier:', tier);
      handlePaymentSuccess(tier);
    }
  }, [searchParams]);

  async function handlePaymentSuccess(tier: string | null) {
    setIsUpdating(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      console.log('Payment success handler:', { tier, userExists: !!user });
      
      if (!user) {
        console.error('No user found');
        setIsUpdating(false);
        return;
      }

      // Determine the tier for the message
      let displayTier = tier || subscription.tier || 'premium';
      const tierName = displayTier.charAt(0).toUpperCase() + displayTier.slice(1);

      // Fallback: If webhook hasn't updated Supabase yet, update it directly
      // This ensures the tier is updated even if the webhook fails
      if (tier && tier !== subscription.tier) {
        console.log('Updating subscription in Supabase:', { userId: user.id, tier, currentTier: subscription.tier });
        
        try {
          // First, check what data exists
          const { data: existingData, error: fetchError } = await supabase
            .from('subscriptions')
            .select('*')
            .eq('user_id', user.id)
            .single();

          console.log('Existing subscription data:', existingData, 'fetch error:', fetchError);

          const { data, error: updateError } = await supabase
            .from('subscriptions')
            .upsert({
              user_id: user.id,
              tier: tier,
              status: 'active',
              updated_at: new Date().toISOString(),
            }, {
              onConflict: 'user_id'
            });

          if (updateError) {
            console.error('Failed to update subscription:', updateError);
            console.error('Error code:', updateError.code);
            console.error('Error message:', updateError.message);
            console.error('Error details:', updateError.details);
            console.error('Error hint:', updateError.hint);
          } else {
            console.log(`Subscription updated successfully:`, data);
            console.log(`Subscription updated to ${tier} for user ${user.id}`);
          }

          // Refresh subscription data to get latest from Supabase
          console.log('Refreshing subscription...');
          await refresh();
          console.log('Subscription refreshed, new tier:', subscription.tier);
        } catch (err) {
          console.error('Exception during Supabase update:', err);
        }
      } else {
        console.log('Tier already matches, skipping update:', { tier, subscription: subscription.tier });
      }

      // Show success toast
      toast({
        title: '🎉 Subscription activated!',
        description: `You now have full access to ${tierName} features. Enjoy!`,
      });

      // Remove success params from URL after a short delay
      setTimeout(() => {
        const params = new URLSearchParams(searchParams);
        params.delete('success');
        params.delete('session_id');
        params.delete('tier');
        setSearchParams(params);
      }, 500);

    } catch (error) {
      console.error('Error handling payment success:', error);
      toast({
        title: 'Subscription activated!',
        description: 'Your subscription is now active. Refresh the page if features are not available.',
      });
    } finally {
      setIsUpdating(false);
    }
  }
}
