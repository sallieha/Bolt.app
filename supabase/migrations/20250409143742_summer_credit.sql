/*
  # Add energy level tracking

  1. New Tables
    - `energy_levels`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `task_id` (uuid, references daily_tasks)
      - `level` (integer, 1-5)
      - `recorded_at` (timestamp)
      - `notes` (text, optional)

  2. Changes
    - Add energy level tracking for daily tasks
    - Enable RLS and add policies
    - Add index for better query performance
*/

CREATE TABLE energy_levels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  task_id uuid REFERENCES daily_tasks ON DELETE CASCADE,
  level integer NOT NULL CHECK (level BETWEEN 1 AND 5),
  recorded_at timestamptz DEFAULT now(),
  notes text,
  UNIQUE(task_id)
);

ALTER TABLE energy_levels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own energy levels"
  ON energy_levels
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create index for better query performance
CREATE INDEX idx_energy_levels_user_recorded 
  ON energy_levels(user_id, recorded_at);