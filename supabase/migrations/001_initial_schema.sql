-- CycleWise Trades Database Schema
-- Version: 1.0.0
-- Date: 2026-02-04

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PROFILES TABLE (extends Supabase auth.users)
-- ============================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  avatar_url TEXT,
  
  -- Cycle Settings
  avg_cycle_length INTEGER DEFAULT 28,
  period_length INTEGER DEFAULT 5,
  last_period_start DATE,
  pms_days INTEGER DEFAULT 3,
  variation_days INTEGER DEFAULT 2,
  period_days JSONB DEFAULT '[]'::jsonb,
  
  -- Challenge/Public Profile Settings
  username TEXT UNIQUE, -- Public username (optional)
  display_name TEXT, -- Display name (falls back to name)
  bio TEXT,
  
  -- Privacy Settings (für Challenges)
  privacy_level TEXT CHECK (privacy_level IN ('private', 'leaderboard', 'public')) DEFAULT 'private',
  anonymous_mode BOOLEAN DEFAULT false, -- Zeige als "Trader #1234" statt Username
  share_strategies BOOLEAN DEFAULT false, -- Strategien für andere sichtbar
  share_stats BOOLEAN DEFAULT false, -- Detaillierte Stats sichtbar
  allow_follow BOOLEAN DEFAULT false, -- Andere können folgen (future)
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add new columns to existing profiles table (if they don't exist)
DO $$ 
BEGIN
  -- Challenge/Public Profile columns
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'username') THEN
    ALTER TABLE public.profiles ADD COLUMN username TEXT UNIQUE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'display_name') THEN
    ALTER TABLE public.profiles ADD COLUMN display_name TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'bio') THEN
    ALTER TABLE public.profiles ADD COLUMN bio TEXT;
  END IF;
  
  -- Privacy Settings columns
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'privacy_level') THEN
    ALTER TABLE public.profiles ADD COLUMN privacy_level TEXT CHECK (privacy_level IN ('private', 'leaderboard', 'public')) DEFAULT 'private';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'anonymous_mode') THEN
    ALTER TABLE public.profiles ADD COLUMN anonymous_mode BOOLEAN DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'share_strategies') THEN
    ALTER TABLE public.profiles ADD COLUMN share_strategies BOOLEAN DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'share_stats') THEN
    ALTER TABLE public.profiles ADD COLUMN share_stats BOOLEAN DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'allow_follow') THEN
    ALTER TABLE public.profiles ADD COLUMN allow_follow BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policies for profiles (drop existing first to avoid conflicts)
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view public profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can view own profile" 
  ON public.profiles FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can view public profiles" 
  ON public.profiles FOR SELECT 
  USING (privacy_level IN ('leaderboard', 'public'));

CREATE POLICY "Users can update own profile" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = id);

-- ============================================
-- TRADES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.trades (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Basic Trade Info
  date DATE NOT NULL,
  time TIME,
  instrument TEXT NOT NULL,
  direction TEXT CHECK (direction IN ('long', 'short')) NOT NULL,
  
  -- Prices
  entry_price DECIMAL(20, 8),
  sl_price DECIMAL(20, 8),
  tp_price DECIMAL(20, 8),
  exit_price DECIMAL(20, 8),
  
  -- Strategy
  strategy TEXT,
  confirmations JSONB DEFAULT '[]'::jsonb,
  
  -- Risk & Results
  risk_percent DECIMAL(5, 2),
  planned_rrr DECIMAL(10, 2),
  planned_sl_size DECIMAL(10, 2), -- NEW: Geplante SL-Größe
  closed_rrr DECIMAL(10, 2),
  max_r_reached DECIMAL(10, 2), -- Maximum R before reversal
  ideal_sl_size DECIMAL(10, 2), -- NEW: Ideale SL-Größe (bei Loss)
  pnl DECIMAL(20, 2),
  
  -- Trade Status
  result TEXT CHECK (result IN ('win', 'loss', 'breakeven', '')),
  status TEXT CHECK (status IN ('open', 'closed')) DEFAULT 'open',
  
  -- Exit Info
  exit_reason TEXT,
  loss_reason TEXT,
  custom_exit_reason TEXT,
  
  -- Notes & Analysis
  pre_trade_note TEXT,
  post_trade_note TEXT,
  learnings TEXT,
  
  -- Emotions
  emotion_before INTEGER CHECK (emotion_before BETWEEN 1 AND 10),
  emotion_after INTEGER CHECK (emotion_after BETWEEN 1 AND 10),
  
  -- Rating
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  
  -- Timeframes
  timeframe_small TEXT,
  timeframe_large TEXT,
  
  -- Screenshots (Supabase Storage URLs)
  image_before_small TEXT,
  image_before_large TEXT,
  image_after_small TEXT,
  image_after_large TEXT,
  
  -- Cycle Data
  cycle_day INTEGER,
  cycle_phase TEXT CHECK (cycle_phase IN ('menstruation', 'follicular', 'ovulation', 'luteal')),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_trades_user_id ON public.trades(user_id);
CREATE INDEX IF NOT EXISTS idx_trades_date ON public.trades(date DESC);
CREATE INDEX IF NOT EXISTS idx_trades_status ON public.trades(status);
CREATE INDEX IF NOT EXISTS idx_trades_user_date ON public.trades(user_id, date DESC);

-- Enable Row Level Security
ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;

-- Policies for trades (drop existing first)
DROP POLICY IF EXISTS "Users can view own trades" ON public.trades;
DROP POLICY IF EXISTS "Users can insert own trades" ON public.trades;
DROP POLICY IF EXISTS "Users can update own trades" ON public.trades;
DROP POLICY IF EXISTS "Users can delete own trades" ON public.trades;

CREATE POLICY "Users can view own trades" 
  ON public.trades FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own trades" 
  ON public.trades FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own trades" 
  ON public.trades FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own trades" 
  ON public.trades FOR DELETE 
  USING (auth.uid() = user_id);

-- ============================================
-- STRATEGIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.strategies (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Basic Info
  name TEXT NOT NULL,
  description TEXT,
  
  -- Markets & Timeframes
  markets TEXT[] DEFAULT '{}',
  timeframes TEXT[] DEFAULT '{}',
  
  -- Strategy Details
  confirmations TEXT[] DEFAULT '{}',
  entry_triggers TEXT[] DEFAULT '{}',
  exit_rules TEXT[] DEFAULT '{}',
  general_rules TEXT[] DEFAULT '{}',
  
  -- Risk Management
  risk_per_trade DECIMAL(5, 2),
  target_rrr DECIMAL(10, 2),
  stop_loss_type TEXT,
  take_profit_type TEXT,
  
  -- Performance (calculated)
  total_trades INTEGER DEFAULT 0,
  win_rate DECIMAL(5, 2),
  avg_rrr DECIMAL(10, 2),
  score INTEGER,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, name)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_strategies_user_id ON public.strategies(user_id);

-- Enable Row Level Security
ALTER TABLE public.strategies ENABLE ROW LEVEL SECURITY;

-- Policies for strategies (drop existing first)
DROP POLICY IF EXISTS "Users can view own strategies" ON public.strategies;
DROP POLICY IF EXISTS "Users can view shared strategies" ON public.strategies;
DROP POLICY IF EXISTS "Users can insert own strategies" ON public.strategies;
DROP POLICY IF EXISTS "Users can update own strategies" ON public.strategies;
DROP POLICY IF EXISTS "Users can delete own strategies" ON public.strategies;

CREATE POLICY "Users can view own strategies" 
  ON public.strategies FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view shared strategies" 
  ON public.strategies FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = strategies.user_id 
      AND profiles.share_strategies = true 
      AND profiles.privacy_level = 'public'
    )
  );

CREATE POLICY "Users can insert own strategies" 
  ON public.strategies FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own strategies" 
  ON public.strategies FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own strategies" 
  ON public.strategies FOR DELETE 
  USING (auth.uid() = user_id);

-- ============================================
-- CYCLE LOGS TABLE (Daily Journal Entries)
-- ============================================
CREATE TABLE IF NOT EXISTS public.cycle_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Daily Logs
  date DATE NOT NULL,
  has_period BOOLEAN DEFAULT FALSE,
  mood INTEGER CHECK (mood BETWEEN 1 AND 10),
  confidence INTEGER CHECK (confidence BETWEEN 1 AND 10),
  energy INTEGER CHECK (energy BETWEEN 1 AND 10),
  
  -- Journal
  notes TEXT,
  quick_note TEXT,
  lessons TEXT,
  attachments JSONB DEFAULT '[]'::jsonb,
  
  -- Safety Mode
  safety_mode_enabled BOOLEAN DEFAULT FALSE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, date)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_cycle_logs_user_id ON public.cycle_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_cycle_logs_date ON public.cycle_logs(date DESC);

-- Enable Row Level Security
ALTER TABLE public.cycle_logs ENABLE ROW LEVEL SECURITY;

-- Policies for cycle_logs (drop existing first)
DROP POLICY IF EXISTS "Users can view own cycle logs" ON public.cycle_logs;
DROP POLICY IF EXISTS "Users can insert own cycle logs" ON public.cycle_logs;
DROP POLICY IF EXISTS "Users can update own cycle logs" ON public.cycle_logs;
DROP POLICY IF EXISTS "Users can delete own cycle logs" ON public.cycle_logs;

CREATE POLICY "Users can view own cycle logs" 
  ON public.cycle_logs FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own cycle logs" 
  ON public.cycle_logs FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cycle logs" 
  ON public.cycle_logs FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own cycle logs" 
  ON public.cycle_logs FOR DELETE 
  USING (auth.uid() = user_id);

-- ============================================
-- PROP FIRM ACCOUNTS TABLE (Encrypted)
-- ============================================
CREATE TABLE IF NOT EXISTS public.prop_firm_accounts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Firm Info
  firm_name TEXT NOT NULL,
  account_number TEXT NOT NULL,
  
  -- Credentials (should be encrypted before storing)
  investor_password_encrypted TEXT, -- Encrypted with user's key
  server TEXT,
  
  -- Account Info
  balance DECIMAL(20, 2),
  equity DECIMAL(20, 2),
  profit DECIMAL(20, 2),
  
  -- Sync Settings
  auto_sync BOOLEAN DEFAULT FALSE,
  last_sync TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, firm_name, account_number)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_prop_firm_accounts_user_id ON public.prop_firm_accounts(user_id);

-- Enable Row Level Security
ALTER TABLE public.prop_firm_accounts ENABLE ROW LEVEL SECURITY;

-- Policies for prop_firm_accounts (drop existing first)
DROP POLICY IF EXISTS "Users can view own prop firm accounts" ON public.prop_firm_accounts;
DROP POLICY IF EXISTS "Users can insert own prop firm accounts" ON public.prop_firm_accounts;
DROP POLICY IF EXISTS "Users can update own prop firm accounts" ON public.prop_firm_accounts;
DROP POLICY IF EXISTS "Users can delete own prop firm accounts" ON public.prop_firm_accounts;

CREATE POLICY "Users can view own prop firm accounts" 
  ON public.prop_firm_accounts FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own prop firm accounts" 
  ON public.prop_firm_accounts FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own prop firm accounts" 
  ON public.prop_firm_accounts FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own prop firm accounts" 
  ON public.prop_firm_accounts FOR DELETE 
  USING (auth.uid() = user_id);

-- ============================================
-- AI INSIGHTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.ai_insights (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Insight Info
  category TEXT CHECK (category IN ('pattern', 'cycle', 'strategy', 'psychology', 'confirmation')) NOT NULL,
  title TEXT NOT NULL,
  insight TEXT NOT NULL,
  actionable TEXT,
  impact TEXT CHECK (impact IN ('Critical', 'High', 'Medium', 'Low')) NOT NULL,
  icon TEXT,
  
  -- Supporting Data
  data JSONB DEFAULT '{}'::jsonb,
  
  -- Status
  is_new BOOLEAN DEFAULT TRUE,
  is_dismissed BOOLEAN DEFAULT FALSE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ai_insights_user_id ON public.ai_insights(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_insights_created_at ON public.ai_insights(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_insights_is_new ON public.ai_insights(is_new) WHERE is_new = TRUE;

-- Enable Row Level Security
ALTER TABLE public.ai_insights ENABLE ROW LEVEL SECURITY;

-- Policies for ai_insights (drop existing first)
DROP POLICY IF EXISTS "Users can view own ai insights" ON public.ai_insights;
DROP POLICY IF EXISTS "Users can insert own ai insights" ON public.ai_insights;
DROP POLICY IF EXISTS "Users can update own ai insights" ON public.ai_insights;
DROP POLICY IF EXISTS "Users can delete own ai insights" ON public.ai_insights;

CREATE POLICY "Users can view own ai insights" 
  ON public.ai_insights FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own ai insights" 
  ON public.ai_insights FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own ai insights" 
  ON public.ai_insights FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own ai insights" 
  ON public.ai_insights FOR DELETE 
  USING (auth.uid() = user_id);

-- ============================================
-- USER SETTINGS TABLE (Custom Win/Loss Reasons etc.)
-- ============================================
CREATE TABLE IF NOT EXISTS public.user_settings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Custom Exit Reasons
  custom_win_reasons TEXT[] DEFAULT '{}',
  custom_loss_reasons TEXT[] DEFAULT '{}',
  default_win_reasons TEXT[] DEFAULT '{}',
  default_loss_reasons TEXT[] DEFAULT '{}',
  
  -- Other Settings
  settings JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id)
);

-- Enable Row Level Security
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- Policies for user_settings (drop existing first)
DROP POLICY IF EXISTS "Users can view own settings" ON public.user_settings;
DROP POLICY IF EXISTS "Users can insert own settings" ON public.user_settings;
DROP POLICY IF EXISTS "Users can update own settings" ON public.user_settings;
DROP POLICY IF EXISTS "Users can delete own settings" ON public.user_settings;

CREATE POLICY "Users can view own settings" 
  ON public.user_settings FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings" 
  ON public.user_settings FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings" 
  ON public.user_settings FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own settings" 
  ON public.user_settings FOR DELETE 
  USING (auth.uid() = user_id);

-- ============================================
-- WEEKLY CHALLENGES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.weekly_challenges (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Challenge Period
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  
  -- Challenge Type
  challenge_type TEXT CHECK (challenge_type IN (
    'best_win_rate',
    'best_rrr',
    'most_consistent',
    'cycle_champion',
    'most_trades'
  )) NOT NULL,
  
  -- Performance Metrics
  total_trades INTEGER DEFAULT 0,
  win_rate DECIMAL(5, 2),
  avg_rrr DECIMAL(10, 2),
  total_r DECIMAL(10, 2),
  consistency_score DECIMAL(5, 2), -- Für "Most Consistent"
  
  -- Ranking
  score DECIMAL(10, 2) NOT NULL, -- Der Wert nach dem gerankt wird
  rank INTEGER,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, week_start, challenge_type)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_weekly_challenges_week ON public.weekly_challenges(week_start DESC);
CREATE INDEX IF NOT EXISTS idx_weekly_challenges_type_rank ON public.weekly_challenges(challenge_type, rank);
CREATE INDEX IF NOT EXISTS idx_weekly_challenges_user ON public.weekly_challenges(user_id);

-- Enable Row Level Security
ALTER TABLE public.weekly_challenges ENABLE ROW LEVEL SECURITY;

-- Policies for weekly_challenges (drop existing first)
DROP POLICY IF EXISTS "Users can view own challenges" ON public.weekly_challenges;
DROP POLICY IF EXISTS "Users can view public challenges" ON public.weekly_challenges;
DROP POLICY IF EXISTS "System can insert challenges" ON public.weekly_challenges;
DROP POLICY IF EXISTS "System can update challenges" ON public.weekly_challenges;

CREATE POLICY "Users can view own challenges" 
  ON public.weekly_challenges FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view public challenges" 
  ON public.weekly_challenges FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = weekly_challenges.user_id 
      AND profiles.privacy_level IN ('leaderboard', 'public')
    )
  );

CREATE POLICY "System can insert challenges" 
  ON public.weekly_challenges FOR INSERT 
  WITH CHECK (true); -- Wird via Backend/Function erstellt

CREATE POLICY "System can update challenges" 
  ON public.weekly_challenges FOR UPDATE 
  USING (true); -- Ranks werden automatisch berechnet

-- ============================================
-- PUBLIC STATS TABLE (Aggregierte Daten)
-- ============================================
CREATE TABLE IF NOT EXISTS public.public_stats (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Time Period
  period_type TEXT CHECK (period_type IN ('weekly', 'monthly', 'all_time')) NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE,
  
  -- Aggregated Stats (NUR Prozente, KEINE $ Zahlen!)
  total_trades INTEGER DEFAULT 0,
  winning_trades INTEGER DEFAULT 0,
  losing_trades INTEGER DEFAULT 0,
  breakeven_trades INTEGER DEFAULT 0,
  
  win_rate DECIMAL(5, 2),
  avg_rrr DECIMAL(10, 2),
  best_rrr DECIMAL(10, 2),
  worst_rrr DECIMAL(10, 2),
  
  avg_risk_percent DECIMAL(5, 2),
  consistency_score DECIMAL(5, 2),
  
  -- Top Strategies
  top_strategy TEXT,
  top_strategy_win_rate DECIMAL(5, 2),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, period_type, period_start)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_public_stats_user ON public.public_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_public_stats_period ON public.public_stats(period_type, period_start DESC);

-- Enable Row Level Security
ALTER TABLE public.public_stats ENABLE ROW LEVEL SECURITY;

-- Policies for public_stats (drop existing first)
DROP POLICY IF EXISTS "Users can view own stats" ON public.public_stats;
DROP POLICY IF EXISTS "Users can view public stats" ON public.public_stats;
DROP POLICY IF EXISTS "System can manage stats" ON public.public_stats;

CREATE POLICY "Users can view own stats" 
  ON public.public_stats FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view public stats" 
  ON public.public_stats FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = public_stats.user_id 
      AND profiles.share_stats = true 
      AND profiles.privacy_level IN ('leaderboard', 'public')
    )
  );

CREATE POLICY "System can manage stats" 
  ON public.public_stats FOR ALL 
  USING (true); -- Wird automatisch berechnet

-- ============================================
-- FOLLOWS TABLE (Optional - für später)
-- ============================================
CREATE TABLE IF NOT EXISTS public.follows (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  follower_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  following_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_follows_follower ON public.follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON public.follows(following_id);

-- Enable Row Level Security
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

-- Policies for follows (drop existing first)
DROP POLICY IF EXISTS "Users can view own follows" ON public.follows;
DROP POLICY IF EXISTS "Users can follow others" ON public.follows;
DROP POLICY IF EXISTS "Users can unfollow" ON public.follows;

CREATE POLICY "Users can view own follows" 
  ON public.follows FOR SELECT 
  USING (auth.uid() = follower_id OR auth.uid() = following_id);

CREATE POLICY "Users can follow others" 
  ON public.follows FOR INSERT 
  WITH CHECK (
    auth.uid() = follower_id AND
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = following_id 
      AND profiles.allow_follow = true
    )
  );

CREATE POLICY "Users can unfollow" 
  ON public.follows FOR DELETE 
  USING (auth.uid() = follower_id);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at (drop existing first)
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
DROP TRIGGER IF EXISTS update_trades_updated_at ON public.trades;
DROP TRIGGER IF EXISTS update_strategies_updated_at ON public.strategies;
DROP TRIGGER IF EXISTS update_cycle_logs_updated_at ON public.cycle_logs;
DROP TRIGGER IF EXISTS update_prop_firm_accounts_updated_at ON public.prop_firm_accounts;
DROP TRIGGER IF EXISTS update_ai_insights_updated_at ON public.ai_insights;
DROP TRIGGER IF EXISTS update_user_settings_updated_at ON public.user_settings;
DROP TRIGGER IF EXISTS update_weekly_challenges_updated_at ON public.weekly_challenges;
DROP TRIGGER IF EXISTS update_public_stats_updated_at ON public.public_stats;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trades_updated_at BEFORE UPDATE ON public.trades
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_strategies_updated_at BEFORE UPDATE ON public.strategies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cycle_logs_updated_at BEFORE UPDATE ON public.cycle_logs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_prop_firm_accounts_updated_at BEFORE UPDATE ON public.prop_firm_accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_insights_updated_at BEFORE UPDATE ON public.ai_insights
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON public.user_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_weekly_challenges_updated_at BEFORE UPDATE ON public.weekly_challenges
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_public_stats_updated_at BEFORE UPDATE ON public.public_stats
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
  );
  
  -- Create default user settings
  INSERT INTO public.user_settings (user_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup (drop existing first)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- STORAGE BUCKETS (for trade screenshots)
-- ============================================

-- Create storage bucket for trade images
INSERT INTO storage.buckets (id, name, public)
VALUES ('trade-images', 'trade-images', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for trade images (drop existing first)
DROP POLICY IF EXISTS "Users can upload own trade images" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own trade images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own trade images" ON storage.objects;

CREATE POLICY "Users can upload own trade images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'trade-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view own trade images"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'trade-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete own trade images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'trade-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
