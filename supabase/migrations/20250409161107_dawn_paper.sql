/*
  # Fix energy levels table structure

  1. Changes
    - Drop and recreate energy_levels table with proper constraints
    - Add proper unique constraints for task_id and goal_id combinations
    - Add check constraint to ensure either task_id or goal_id is set
    - Create indexes for better query performance

  2. Notes
    - Ensures data integrity with proper constraints
    - Maintains unique combinations of (task_id, date) and (goal_id, date)
    - Adds proper foreign key relationships with cascade deletes
*/

-- Drop existing table and recreate with proper structure
DROP TABLE IF EXISTS energy_levels;

CREATE TABLE energy_levels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  task_id uuid REFERENCES daily_tasks ON DELETE CASCADE,
  goal_id uuid REFERENCES goals ON DELETE CASCADE,
  level integer NOT NULL CHECK (level >= 1 AND level <= 5),
  recorded_at timestamptz DEFAULT now(),
  notes text,
  date date NOT NULL DEFAULT CURRENT_DATE,
  -- Ensure either task_id or goal_id is set, but not both
  CONSTRAINT energy_levels_id_check CHECK (
    (task_id IS NOT NULL AND goal_id IS NULL) OR 
    (task_id IS NULL AND goal_id IS NOT NULL)
  ),
  -- Add unique constraints for task_id and goal_id combinations
  CONSTRAINT energy_levels_task_date_key UNIQUE NULLS NOT DISTINCT (task_id, date),
  CONSTRAINT energy_levels_goal_date_key UNIQUE NULLS NOT DISTINCT (goal_id, date)
);

-- Create indexes for better query performance
CREATE INDEX idx_energy_levels_task_date ON energy_levels(task_id, date);
CREATE INDEX idx_energy_levels_goal_date ON energy_levels(goal_id, date);
CREATE INDEX idx_energy_levels_user_date ON energy_levels(user_id, date);

-- Enable RLS
ALTER TABLE energy_levels ENABLE ROW LEVEL SECURITY;

-- Create RLS policy
CREATE POLICY "Users can manage their own energy levels"
  ON energy_levels
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);