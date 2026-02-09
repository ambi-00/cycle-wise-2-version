import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useToast } from './use-toast';
import { useSubscription } from './use-subscription';

/**
 * Hook to show success message after Stripe payment redirect
 * Automatically displays a toast when user is redirected from Stripe checkout
 */
export function usePaymentSuccess() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const { subscription } = useSubscription();

  useEffect(() => {
    const success = searchParams.get('success');
    const sessionId = searchParams.get('session_id');

    if (success === 'true' && sessionId) {
      // Get the tier from subscription
      const tier = subscription.tier || 'premium';
      const tierName = tier.charAt(0).toUpperCase() + tier.slice(1);

      // Show success toast
      toast({
        title: '🎉 Subscription activated!',
        description: `You now have full access to ${tierName} features. Enjoy!`,
      });

      // Remove success params from URL
      searchParams.delete('success');
      searchParams.delete('session_id');
      setSearchParams(searchParams);
    }
  }, [searchParams, setSearchParams, toast, subscription.tier]);
}
