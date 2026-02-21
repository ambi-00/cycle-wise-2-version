import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type SubscriptionTier = 'free' | 'premium' | 'pro';

export interface Subscription {
  tier: SubscriptionTier;
  status: 'active' | 'inactive' | 'cancelled';
  currentPeriodEnd?: Date;
}

// Feature access mapping
const FEATURES = {
  // FREE features
  basic_tracking: ['free', 'premium', 'pro'],
  day_view: ['free', 'premium', 'pro'],
  dashboard: ['free', 'premium', 'pro'],
  challenges: ['free', 'premium', 'pro'],
  propfirm_compare: ['free', 'premium', 'pro'],
  basic_statistics: ['free', 'premium', 'pro'],
  
  // PREMIUM features (NO AI)
  cycle_tracking: ['premium', 'pro'],
  cloud_sync: ['premium', 'pro'],
  advanced_filters: ['premium', 'pro'],
  unlimited_strategies: ['premium', 'pro'],
  custom_reasons: ['premium', 'pro'],
  export_reports: ['premium', 'pro'],
  full_statistics: ['premium', 'pro'],
  rrr_calculator: ['premium', 'pro'],
  ideal_sl_calculator: ['premium', 'pro'],
  propfirm_discounts: ['premium', 'pro'],
  
  // PRO features (AI-powered)
  ai_insights_weekly: ['premium', 'pro'],
  ai_insights_daily: ['pro'],
  smart_predictions: ['pro'],
  propfirm_integration: ['pro'],
  safety_mode: ['pro'],
  advanced_risk_analytics: ['pro'],
  early_access: ['pro'],
} as const;

export type Feature = keyof typeof FEATURES;

// Trade limits by tier
const TRADE_LIMITS = {
  free: 50,
  premium: 100,
  pro: Infinity,
};

// Screenshot limits by tier
const SCREENSHOT_LIMITS = {
  free: 2,
  premium: 4,
  pro: 4,
};

export function useSubscription() {
  const [subscription, setSubscription] = useState<Subscription>({
    tier: 'free',
    status: 'active',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Dev mode only - provide PRO features for development (no login needed)
    // FILMING/DEMO modes do NOT affect subscription tier - they only affect UI visibility
    if (import.meta.env.VITE_SKIP_EMAIL_VERIFICATION === 'true') {
      console.log('📊 Subscription - Auto-set to PRO for dev mode (SKIP_EMAIL_VERIFICATION=true)');
      setSubscription({ tier: 'pro', status: 'active' });
      setLoading(false);
      return;
    }
    
    loadSubscription();
  }, []);

  async function loadSubscription() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setSubscription({ tier: 'free', status: 'active' });
        setLoading(false);
        return;
      }

      // Query the subscriptions table
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error || !data) {
        // No subscription found, fallback to profiles.tier
        console.log('📊 Subscription Debug - No data in subscriptions table, checking profiles...');
        
        const { data: profile } = await supabase
          .from('profiles')
          .select('tier')
          .eq('id', user.id)
          .single();
        
        const tier = (profile?.tier as SubscriptionTier) || 'free';
        console.log('📊 Subscription Debug - Loaded from profiles:', tier);
        setSubscription({ tier, status: 'active' });
      } else {
        console.log('📊 Subscription Debug - Loaded from subscriptions:', data.tier, data.status);
        setSubscription({
          tier: data.tier as SubscriptionTier,
          status: data.status as 'active' | 'inactive' | 'cancelled',
          currentPeriodEnd: data.current_period_end ? new Date(data.current_period_end) : undefined,
        });
      }
    } catch (error) {
      console.error('Error loading subscription:', error);
      setSubscription({ tier: 'free', status: 'active' });
    } finally {
      setLoading(false);
    }
  }

  function hasFeature(feature: Feature): boolean {
    const allowedTiers = FEATURES[feature] as readonly SubscriptionTier[];
    return allowedTiers.includes(subscription.tier);
  }

  function getTradeLimit(): number {
    return TRADE_LIMITS[subscription.tier];
  }

  function getScreenshotLimit(): number {
    return SCREENSHOT_LIMITS[subscription.tier];
  }

  function canUpgradeTo(targetTier: SubscriptionTier): boolean {
    const tierOrder = { free: 0, premium: 1, pro: 2 };
    return tierOrder[targetTier] > tierOrder[subscription.tier];
  }

  return {
    subscription,
    loading,
    hasFeature,
    getTradeLimit,
    getScreenshotLimit,
    canUpgradeTo,
    refresh: loadSubscription,
  };
}
