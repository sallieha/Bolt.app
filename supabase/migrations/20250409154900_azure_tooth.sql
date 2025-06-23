/*
  # Fix energy levels table structure and constraints

  1. Changes
    - Recreate energy_levels table with proper constraints
    - Add proper handling for task_id and goal_id exclusivity
    - Create appropriate indexes for performance
    - Migrate existing data safely

  2. Notes
    - Ensures data integrity with proper constraints
    - Maintains unique combinations of (task_id, date) and (goal_id, date)
    - Adds proper foreign key relationships with cascade deletes
*/

-- First drop existing indexes and constraints to start fresh
DROP INDEX IF EXISTS energy_levels_task_date_idx;
DROP INDEX IF EXISTS energy_levels_goal_date_idx;
ALTER TABLE energy_levels DROP CONSTRAINT IF EXISTS energy_levels_id_check;

-- Create temporary table for data migration
CREATE TABLE energy_levels_new (
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

-- Copy data with explicit column list to avoid type mismatches
INSERT INTO energy_levels_new (
  id, user_id, task_id, goal_id, level, recorded_at, notes, date
)
SELECT 
  id, user_id, task_id, goal_id, level, recorded_at, notes, date
FROM energy_levels;

-- Drop old table and rename new one
DROP TABLE energy_levels;
ALTER TABLE energy_levels_new RENAME TO energy_levels;

-- Create unique indexes
CREATE UNIQUE INDEX energy_levels_task_date_idx 
ON energy_levels (task_id, date) 
WHERE task_id IS NOT NULL;

CREATE UNIQUE INDEX energy_levels_goal_date_idx 
ON energy_levels (goal_id, date) 
WHERE goal_id IS NOT NULL;

-- Create additional indexes for performance
CREATE INDEX idx_energy_levels_task_date 
ON energy_levels (task_id, date);

CREATE INDEX idx_energy_levels_goal_date 
ON energy_levels (goal_id, date);

CREATE INDEX idx_energy_levels_user_date 
ON energy_levels (user_id, date);

-- Enable RLS
ALTER TABLE energy_levels ENABLE ROW LEVEL SECURITY;

-- Recreate RLS policy
CREATE POLICY "Users can manage their own energy levels"
ON energy_levels
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);