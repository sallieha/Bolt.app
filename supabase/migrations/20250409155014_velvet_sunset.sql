/*
  # Update energy levels table structure

  1. Changes
    - Add unique constraints for task/goal combinations
    - Ensure proper indexing for performance
    - Add check constraints for data integrity

  2. Notes
    - Allows updating energy levels at any time
    - Maintains unique energy level per task/goal per day
    - Improves query performance with proper indexes
*/

-- First ensure we have the right columns and constraints
CREATE TABLE IF NOT EXISTS energy_levels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  task_id uuid REFERENCES daily_tasks ON DELETE CASCADE,
  goal_id uuid REFERENCES goals ON DELETE CASCADE,
  level integer NOT NULL CHECK (level >= 1 AND level <= 5),
  recorded_at timestamptz DEFAULT now(),
  notes text,
  date date NOT NULL DEFAULT CURRENT_DATE,
  CONSTRAINT energy_levels_id_check CHECK (
    (task_id IS NOT NULL AND goal_id IS NULL) OR 
    (task_id IS NULL AND goal_id IS NOT NULL)
  )
);

-- Create unique indexes for task/goal combinations
CREATE UNIQUE INDEX IF NOT EXISTS energy_levels_task_date_idx 
ON energy_levels (task_id, date) 
WHERE task_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS energy_levels_goal_date_idx 
ON energy_levels (goal_id, date) 
WHERE goal_id IS NOT NULL;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_energy_levels_task_date 
ON energy_levels (task_id, date);

CREATE INDEX IF NOT EXISTS idx_energy_levels_goal_date 
ON energy_levels (goal_id, date);

CREATE INDEX IF NOT EXISTS idx_energy_levels_user_date 
ON energy_levels (user_id, date);

-- Enable RLS
ALTER TABLE energy_levels ENABLE ROW LEVEL SECURITY;

-- Update RLS policy
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Users can manage their own energy levels" ON energy_levels;
  
  CREATE POLICY "Users can manage their own energy levels"
    ON energy_levels
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
END $$;