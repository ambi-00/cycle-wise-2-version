import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type AppMode = 'USER' | 'FILMING' | 'DEMO';

interface AppModeState {
  appMode: AppMode;
  isLoading: boolean;
}

/**
 * Hook to get current app mode from Supabase
 * 
 * USER: Normal mode with all features
 * FILMING: Limited features for video content (no gamification/social)
 * DEMO: Fake data for presentations
 */
export function useAppMode(): AppModeState {
  const [appMode, setAppMode] = useState<AppMode>('USER');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadAppMode = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setAppMode('USER');
          setIsLoading(false);
          return;
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('app_mode')
          .eq('id', user.id)
          .single();

        if (profile?.app_mode) {
          setAppMode(profile.app_mode as AppMode);
        }
      } catch (error) {
        console.error('Failed to load app mode:', error);
        setAppMode('USER');
      } finally {
        setIsLoading(false);
      }
    };

    loadAppMode();
  }, []);

  return { appMode, isLoading };
}

/**
 * Helper to check if specific features should be shown
 */
export function useFeatureFlags() {
  const { appMode } = useAppMode();

  return {
    // Gamification (XP, Streaks, Achievements)
    showGamification: appMode === 'USER',
    
    // Social/Community Features
    showLeaderboard: appMode === 'USER',
    showChallenges: appMode === 'USER',
    
    // Prop Firm
    showPropFirmAccounts: true, // Always show accounts
    showPropFirmComparison: appMode === 'USER', // Only comparison in USER mode
    
    // AI Features
    showAIInsights: true, // Always show (selling point!)
    
    // Core Features (always visible)
    showJournal: true,
    showCycleTracker: true,
    showTrades: true,
    showDashboard: true,
    showAnalytics: true,
    showCalendar: true,
  };
}
