/*
  # Fix energy levels constraints

  1. Changes
    - Update existing data to ensure data integrity
    - Drop existing constraint
    - Create new unique constraints that handle NULL values correctly
    - Add check constraint to ensure valid data

  2. Notes
    - Ensures each task or goal can only have one energy level per date
    - Handles NULL values appropriately
    - Maintains data integrity
*/

-- First, clean up any invalid data
DELETE FROM energy_levels
WHERE task_id IS NULL AND goal_id IS NULL;

-- Drop existing constraint if it exists
ALTER TABLE energy_levels 
DROP CONSTRAINT IF EXISTS energy_levels_task_date_key;

-- Create separate unique constraints for task_id and goal_id
CREATE UNIQUE INDEX energy_levels_task_date_idx 
ON energy_levels (task_id, date) 
WHERE task_id IS NOT NULL;

CREATE UNIQUE INDEX energy_levels_goal_date_idx 
ON energy_levels (goal_id, date) 
WHERE goal_id IS NOT NULL;

-- Add check constraint to ensure either task_id or goal_id is set
ALTER TABLE energy_levels
ADD CONSTRAINT energy_levels_id_check
CHECK (
  (task_id IS NOT NULL AND goal_id IS NULL) OR
  (task_id IS NULL AND goal_id IS NOT NULL)
);