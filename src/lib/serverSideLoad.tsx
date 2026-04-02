import { Suspense, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';

/**
 * Higher-Order Component für Server-Side-ähnliches Loading
 * - Lädt User + Subscription BEVOR Komponente rendert
 * - Kein Flackern, kein Loading State sichtbar
 */
export function withServerSideLoad<P extends object>(
  Component: React.ComponentType<P & { tier: 'free' | 'premium' | 'pro' }>
) {
  return function ProtectedComponent(props: P) {
    const [tier, setTier] = useState<'free' | 'premium' | 'pro' | null>(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
      let isMounted = true;

      const loadData = async () => {
        try {
          // Get current user
          const user = (await supabase.auth.getSession()).data.session?.user ?? null;

          if (!user) {
            if (isMounted) navigate('/login');
            return;
          }

          // Get subscription tier
          const { data: subscription, error: subError } = await supabase
            .from('subscriptions')
            .select('tier')
            .eq('user_id', user.id)
            .single();

          if (subError) {
            console.error('Subscription error:', subError);
            if (isMounted) navigate('/login');
            return;
          }

          // Set tier BEFORE rendering child component
          if (isMounted) {
            setTier(subscription?.tier || 'free');
          }
        } catch (error) {
          console.error('Load error:', error);
          if (isMounted) navigate('/login');
        } finally {
          if (isMounted) setLoading(false);
        }
      };

      loadData();

      // Cleanup
      return () => {
        isMounted = false;
      };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Empty dependency array - run only once

    // While loading, show blank/minimal UI (no flicker)
    if (loading || !tier) {
      return <div className="min-h-screen bg-background" />; // blank screen, kein Flackern
    }

    // Render with tier known (kein Upsell flackern)
    return <Component {...props} tier={tier} />;
  };
}

/**
 * Alternative: Hook für Pages die tier brauchen
 */
export function useServerSideData() {
  const [data, setData] = useState<{
    user: any;
    tier: 'free' | 'premium' | 'pro';
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      try {
        const user = (await supabase.auth.getSession()).data.session?.user ?? null;

        if (!user) {
          if (isMounted) navigate('/login');
          return;
        }

        const { data: subscription } = await supabase
          .from('subscriptions')
          .select('tier')
          .eq('user_id', user.id)
          .single();

        if (isMounted) {
          setData({
            user,
            tier: subscription?.tier || 'free',
          });
        }
      } catch (error) {
        if (isMounted) navigate('/login');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    load();

    // Cleanup function
    return () => {
      isMounted = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array - run only once on mount

  return { data, loading };
}
