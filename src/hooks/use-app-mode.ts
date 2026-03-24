import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import * as demoData from '@/data/demo-data';

export type AppMode = 'USER' | 'FILMING' | 'DEMO';

interface AppModeState {
  appMode: AppMode;
  isLoading: boolean;
  userId?: string;
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
  const [userId, setUserId] = useState<string>();

  useEffect(() => {
    const loadAppMode = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        console.log('🎬 App Mode Debug - User:', user?.id);
        
        if (!user) {
          console.log('🎬 App Mode: No user found, defaulting to USER');
          setAppMode('USER');
          setIsLoading(false);
          return;
        }

        setUserId(user.id);

        const { data: profile, error } = await supabase
          .from('profiles')
          .select('app_mode')
          .eq('id', user.id)
          .single();

        console.log('🎬 App Mode Debug - Profile:', profile);
        console.log('🎬 App Mode Debug - Error:', error);
        const p = profile as any;
        console.log('🎬 App Mode Debug - Mode:', p?.app_mode);

        if (p?.app_mode) {
          setAppMode(p.app_mode as AppMode);
          // Store in localStorage for tradeLoaders
          localStorage.setItem('cw_app_mode', p.app_mode);
          console.log('🎬 App Mode SET TO:', p.app_mode);
        } else {
          console.log('🎬 App Mode: No app_mode in profile, defaulting to USER');
          localStorage.setItem('cw_app_mode', 'USER');
        }
      } catch (error) {
        console.error('Failed to load app mode:', error);
        setAppMode('USER');
        localStorage.setItem('cw_app_mode', 'USER');
      } finally {
        setIsLoading(false);
      }
    };

    loadAppMode();
  }, []);

  return { appMode, isLoading, userId };
}

/**
 * Helper to check if specific features should be shown
 */
export function useFeatureFlags() {
  const { appMode } = useAppMode();
  
  console.log('🎬 Feature Flags - App Mode:', appMode);

  return {
    // Gamification (XP, Streaks, Achievements)
    showGamification: appMode !== 'FILMING',
    
    // Social/Community Features
    showLeaderboard: appMode !== 'FILMING',
    showChallenges: appMode !== 'FILMING',
    
    // Prop Firm
    showPropFirmAccounts: true, // Always show accounts
    showPropFirmComparison: appMode !== 'FILMING', // Hide only in FILMING mode
    
    // AI Features
    showAIInsights: true, // Always show (selling point!)
    
    // Core Features (always visible)
    showJournal: true,
    showCycleTracker: true,
    showTrades: true,
    showDashboard: true,
    showAnalytics: true,
    showCalendar: true,
    
    // Data source
    useDemoData: appMode === 'DEMO',
  };
}

/**
 * Hook to get demo trades if in DEMO mode
 */
export function useDemoTrades() {
  const { appMode } = useAppMode();
  
  if (appMode === 'DEMO') {
    const { generateDemoTrades, getDemoStats } = demoData;
    return {
      trades: generateDemoTrades(),
      stats: getDemoStats(),
      isDemoMode: true,
    };
  }
  
  return {
    trades: [],
    stats: null,
    isDemoMode: false,
  };
}
