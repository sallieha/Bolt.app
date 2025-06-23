/*
  # Add goal misses table

  1. New Tables
    - `goal_misses`
      - `id` (uuid, primary key)
      - `goal_id` (uuid, references goals)
      - `user_id` (uuid, references users)
      - `missed_date` (date)
      - `reason` (text)
      - `improvement_plan` (text)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `goal_misses` table
    - Add policy for authenticated users to manage their own missed goals
*/

-- Create goal_misses table with unique constraint included in table definition
CREATE TABLE IF NOT EXISTS goal_misses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id uuid NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id),
  missed_date date NOT NULL,
  reason text,
  improvement_plan text,
  created_at timestamptz DEFAULT now(),
  UNIQUE (goal_id, missed_date)
);

-- Enable RLS
ALTER TABLE goal_misses ENABLE ROW LEVEL SECURITY;

-- Add RLS policies
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'goal_misses' 
    AND policyname = 'Users can manage their own missed goals'
  ) THEN
    CREATE POLICY "Users can manage their own missed goals"
      ON goal_misses
      FOR ALL
      TO authenticated
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_misses_user_date ON goal_misses(user_id, missed_date);