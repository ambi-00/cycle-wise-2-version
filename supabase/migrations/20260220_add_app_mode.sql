-- Add app_mode to profiles table
-- Supports USER (normal), FILMING (for videos), DEMO (fake data)

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS app_mode TEXT DEFAULT 'USER' 
CHECK (app_mode IN ('USER', 'FILMING', 'DEMO'));

-- Add comment for documentation
COMMENT ON COLUMN profiles.app_mode IS 'App display mode: USER = normal, FILMING = limited features for videos, DEMO = fake data for presentations';

-- Update existing users to USER mode
UPDATE profiles SET app_mode = 'USER' WHERE app_mode IS NULL;
