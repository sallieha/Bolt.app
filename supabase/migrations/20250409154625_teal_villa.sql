/*
  # Add unique constraints to energy_levels table

  1. Changes
    - Add unique constraint for task_id and date combination
    - Add unique constraint for goal_id and date combination
    - Ensure nullability is handled correctly for both constraints

  2. Purpose
    - Enable proper upsert operations on energy_levels table
    - Prevent duplicate entries for the same task/goal on the same date
    - Fix the "no unique constraint matching ON CONFLICT specification" error
*/

-- Drop existing indexes if they exist to avoid conflicts
DROP INDEX IF EXISTS energy_levels_task_date_idx;
DROP INDEX IF EXISTS energy_levels_goal_date_idx;

-- Create new unique indexes that handle NULL values correctly
CREATE UNIQUE INDEX energy_levels_task_date_idx ON energy_levels (task_id, date) 
WHERE task_id IS NOT NULL;

CREATE UNIQUE INDEX energy_levels_goal_date_idx ON energy_levels (goal_id, date) 
WHERE goal_id IS NOT NULL;