-- Add tier field to profiles table for denormalization and performance
-- This ensures we can quickly check subscription tier without joining tables

-- Add tier column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'tier') THEN
    ALTER TABLE public.profiles ADD COLUMN tier TEXT DEFAULT 'free' CHECK (tier IN ('free', 'premium', 'pro'));
  END IF;
END $$;

-- Create index for faster tier queries
CREATE INDEX IF NOT EXISTS idx_profiles_tier ON public.profiles(tier);

-- Sync existing subscriptions to profiles
DO $$ 
BEGIN
  UPDATE public.profiles p
  SET tier = COALESCE(s.tier, 'free')
  FROM public.subscriptions s
  WHERE p.id = s.user_id AND p.tier = 'free' AND s.tier != 'free';
END $$;

-- Create trigger to sync tier changes from subscriptions to profiles
CREATE OR REPLACE FUNCTION sync_subscription_tier_to_profile()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profiles
  SET tier = NEW.tier
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sync_subscription_tier_trigger ON public.subscriptions;
CREATE TRIGGER sync_subscription_tier_trigger
AFTER INSERT OR UPDATE ON public.subscriptions
FOR EACH ROW
EXECUTE FUNCTION sync_subscription_tier_to_profile();

COMMENT ON COLUMN public.profiles.tier IS 'Denormalized subscription tier for quick access (synced from subscriptions table)';
