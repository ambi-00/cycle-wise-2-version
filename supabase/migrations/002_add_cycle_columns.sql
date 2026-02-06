-- Add missing cycle settings columns to profiles table
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'avg_cycle_length') THEN
    ALTER TABLE public.profiles ADD COLUMN avg_cycle_length INTEGER DEFAULT 28;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'period_length') THEN
    ALTER TABLE public.profiles ADD COLUMN period_length INTEGER DEFAULT 5;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'last_period_start') THEN
    ALTER TABLE public.profiles ADD COLUMN last_period_start DATE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'pms_days') THEN
    ALTER TABLE public.profiles ADD COLUMN pms_days INTEGER DEFAULT 3;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'variation_days') THEN
    ALTER TABLE public.profiles ADD COLUMN variation_days INTEGER DEFAULT 2;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'period_days') THEN
    ALTER TABLE public.profiles ADD COLUMN period_days JSONB DEFAULT '[]'::jsonb;
  END IF;
END $$;
