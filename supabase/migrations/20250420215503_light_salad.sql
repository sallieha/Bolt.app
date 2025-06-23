/*
  # Add Google Calendar integration

  1. Changes
    - Create user_calendar_tokens table if not exists
    - Enable RLS
    - Add policy for authenticated users (with existence check)
*/

-- Create the table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_calendar_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  access_token text NOT NULL,
  refresh_token text NOT NULL,
  expiry_date bigint NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE user_calendar_tokens ENABLE ROW LEVEL SECURITY;

-- Add policy if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_calendar_tokens' 
    AND policyname = 'Users can manage their own calendar tokens'
  ) THEN
    CREATE POLICY "Users can manage their own calendar tokens"
      ON user_calendar_tokens
      FOR ALL
      TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;