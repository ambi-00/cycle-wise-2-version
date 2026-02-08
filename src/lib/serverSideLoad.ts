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
      const loadData = async () => {
        try {
          // Get current user
          const {
            data: { user },
            error: userError,
          } = await supabase.auth.getUser();

          if (userError || !user) {
            navigate('/login');
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
            navigate('/login');
            return;
          }

          // Set tier BEFORE rendering child component
          setTier(subscription?.tier || 'free');
        } catch (error) {
          console.error('Load error:', error);
          navigate('/login');
        } finally {
          setLoading(false);
        }
      };

      loadData();
    }, [navigate]);

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
    const load = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          navigate('/login');
          return;
        }

        const { data: subscription } = await supabase
          .from('subscriptions')
          .select('tier')
          .eq('user_id', user.id)
          .single();

        setData({
          user,
          tier: subscription?.tier || 'free',
        });
      } catch (error) {
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [navigate]);

  return { data, loading };
}
