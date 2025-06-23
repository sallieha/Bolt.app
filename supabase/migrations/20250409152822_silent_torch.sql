/*
  # Fix energy levels constraint

  1. Changes
    - Drop existing deferrable unique constraint on energy_levels table
    - Create new non-deferrable unique constraint for task_id and date

  2. Details
    - Removes the deferrable constraint that was causing ON CONFLICT issues
    - Replaces it with a standard unique constraint that works with upsert operations
*/

-- Drop the existing deferrable constraint
ALTER TABLE energy_levels 
DROP CONSTRAINT IF EXISTS energy_levels_task_date_key;

-- Create new non-deferrable unique constraint
ALTER TABLE energy_levels
ADD CONSTRAINT energy_levels_task_date_key 
UNIQUE (task_id, date);

-- Create an index to support the constraint (if it doesn't exist)
CREATE INDEX IF NOT EXISTS idx_energy_levels_task_date 
ON energy_levels (task_id, date);