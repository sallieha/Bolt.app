/*
  # Add missed goals tracking

  1. New Tables
    - `goal_misses`
      - `id` (uuid, primary key)
      - `goal_id` (uuid, references goals)
      - `user_id` (uuid, references auth.users)
      - `missed_date` (date)
      - `reason` (text)
      - `improvement_plan` (text)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `goal_misses` table
    - Add policy for authenticated users to manage their own missed goals
*/

CREATE TABLE IF NOT EXISTS goal_misses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id uuid REFERENCES goals(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id),
  missed_date date NOT NULL,
  reason text,
  improvement_plan text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE goal_misses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own missed goals"
  ON goal_misses
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Add unique constraint to prevent multiple misses for the same goal on the same day
ALTER TABLE goal_misses
  ADD CONSTRAINT goal_misses_goal_id_missed_date_key
  UNIQUE (goal_id, missed_date);