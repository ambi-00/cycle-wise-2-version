-- Gamification System: XP, Ranks, Streaks
-- This migration adds a complete gamification layer with anti-cheat mechanics

-- XP Activity Log Table (tracks all XP changes)
CREATE TABLE IF NOT EXISTS public.xp_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL, -- Can be positive or negative
  reason TEXT NOT NULL, -- "trade_compliant", "rule_break", "ai_insight", "login_streak", etc.
  details JSONB, -- Additional context (trade_id, insight_id, etc.)
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add gamification columns to profiles
DO $$ 
BEGIN
  -- Total XP (lifetime accumulated)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'total_xp') THEN
    ALTER TABLE public.profiles ADD COLUMN total_xp INTEGER DEFAULT 0;
  END IF;
  
  -- Current rank tier
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'current_rank') THEN
    ALTER TABLE public.profiles ADD COLUMN current_rank TEXT DEFAULT 'bronze';
  END IF;
  
  -- Login streak
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'login_streak') THEN
    ALTER TABLE public.profiles ADD COLUMN login_streak INTEGER DEFAULT 0;
  END IF;
  
  -- Trading streak (consecutive days with compliant trades)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'trading_streak') THEN
    ALTER TABLE public.profiles ADD COLUMN trading_streak INTEGER DEFAULT 0;
  END IF;
  
  -- Last login date (for streak tracking)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'last_login') THEN
    ALTER TABLE public.profiles ADD COLUMN last_login DATE;
  END IF;
  
  -- Last XP decay date (for monthly decay)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'last_xp_decay') THEN
    ALTER TABLE public.profiles ADD COLUMN last_xp_decay DATE;
  END IF;
  
  -- Monthly XP (resets each month, used for rank maintenance)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'monthly_xp') THEN
    ALTER TABLE public.profiles ADD COLUMN monthly_xp INTEGER DEFAULT 0;
  END IF;
  
  -- Last monthly reset date
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'last_monthly_reset') THEN
    ALTER TABLE public.profiles ADD COLUMN last_monthly_reset DATE DEFAULT CURRENT_DATE;
  END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_xp_logs_user_id ON public.xp_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_xp_logs_created_at ON public.xp_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_total_xp ON public.profiles(total_xp DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_monthly_xp ON public.profiles(monthly_xp DESC);

-- Row Level Security for xp_logs
ALTER TABLE public.xp_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own XP logs"
  ON public.xp_logs
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert XP logs"
  ON public.xp_logs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Function to calculate rank from XP
CREATE OR REPLACE FUNCTION calculate_rank(xp INTEGER)
RETURNS TEXT AS $$
BEGIN
  IF xp >= 10000 THEN RETURN 'diamond';
  ELSIF xp >= 6000 THEN RETURN 'platinum';
  ELSIF xp >= 3000 THEN RETURN 'gold';
  ELSIF xp >= 1000 THEN RETURN 'silver';
  ELSE RETURN 'bronze';
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to get minimum monthly XP required for rank
CREATE OR REPLACE FUNCTION get_rank_monthly_requirement(rank TEXT)
RETURNS INTEGER AS $$
BEGIN
  CASE rank
    WHEN 'diamond' THEN RETURN 2000;
    WHEN 'platinum' THEN RETURN 1000;
    WHEN 'gold' THEN RETURN 500;
    WHEN 'silver' THEN RETURN 200;
    WHEN 'bronze' THEN RETURN 50;
    ELSE RETURN 0;
  END CASE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Trigger to update rank when XP changes
CREATE OR REPLACE FUNCTION update_rank_on_xp_change()
RETURNS TRIGGER AS $$
BEGIN
  NEW.current_rank := calculate_rank(NEW.total_xp);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_rank ON public.profiles;
CREATE TRIGGER trigger_update_rank
  BEFORE UPDATE OF total_xp ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_rank_on_xp_change();

-- Function to process monthly XP decay and reset
CREATE OR REPLACE FUNCTION process_monthly_maintenance()
RETURNS void AS $$
DECLARE
  profile_record RECORD;
  required_monthly_xp INTEGER;
  xp_penalty INTEGER;
BEGIN
  FOR profile_record IN 
    SELECT * FROM public.profiles 
    WHERE last_monthly_reset < CURRENT_DATE - INTERVAL '1 month'
  LOOP
    -- Get monthly requirement for current rank
    required_monthly_xp := get_rank_monthly_requirement(profile_record.current_rank);
    
    -- If didn't meet requirement, apply 20% penalty
    IF profile_record.monthly_xp < required_monthly_xp THEN
      xp_penalty := GREATEST(FLOOR(profile_record.total_xp * 0.2), 0);
      
      UPDATE public.profiles
      SET 
        total_xp = GREATEST(total_xp - xp_penalty, 0),
        monthly_xp = 0,
        last_monthly_reset = CURRENT_DATE
      WHERE id = profile_record.id;
      
      -- Log the decay
      INSERT INTO public.xp_logs (user_id, amount, reason, details)
      VALUES (
        profile_record.id,
        -xp_penalty,
        'monthly_decay',
        jsonb_build_object(
          'required_monthly_xp', required_monthly_xp,
          'earned_monthly_xp', profile_record.monthly_xp,
          'rank', profile_record.current_rank
        )
      );
    ELSE
      -- Met requirement, just reset monthly counter
      UPDATE public.profiles
      SET 
        monthly_xp = 0,
        last_monthly_reset = CURRENT_DATE
      WHERE id = profile_record.id;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE public.xp_logs IS 'Tracks all XP changes for transparency and anti-cheat';
COMMENT ON COLUMN public.profiles.total_xp IS 'Lifetime accumulated XP';
COMMENT ON COLUMN public.profiles.current_rank IS 'Current tier: bronze, silver, gold, platinum, diamond';
COMMENT ON COLUMN public.profiles.monthly_xp IS 'XP earned this month (for rank maintenance)';
