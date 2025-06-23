/*
  # Add Google Calendar integration

  1. New Tables
    - `user_calendar_tokens`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `access_token` (text)
      - `refresh_token` (text)
      - `expiry_date` (bigint)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS
    - Add policy for users to manage their own tokens
*/

CREATE TABLE user_calendar_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  access_token text NOT NULL,
  refresh_token text NOT NULL,
  expiry_date bigint NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE user_calendar_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own calendar tokens"
  ON user_calendar_tokens
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);