-- Fix RLS for app_mode column
-- Users should be able to read and update their own app_mode

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can read own app_mode" ON profiles;
DROP POLICY IF EXISTS "Users can update own app_mode" ON profiles;

-- Allow users to read their own app_mode
CREATE POLICY "Users can read own app_mode"
ON profiles
FOR SELECT
USING (auth.uid() = id);

-- Allow users to update their own app_mode
CREATE POLICY "Users can update own app_mode"
ON profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Verify RLS is enabled on profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
