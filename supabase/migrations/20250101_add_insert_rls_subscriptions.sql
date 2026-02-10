-- Allow authenticated users to INSERT their own subscription row
-- This is needed as a fallback when the webhook doesn't create the row

-- Check if the policy already exists before creating
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'subscriptions' 
        AND policyname = 'Users can insert their own subscription'
    ) THEN
        CREATE POLICY "Users can insert their own subscription"
            ON subscriptions
            FOR INSERT
            TO authenticated
            WITH CHECK (auth.uid() = user_id);
    END IF;
END
$$;
