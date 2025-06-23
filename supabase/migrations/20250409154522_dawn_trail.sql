/*
  # Add unique constraint to energy_levels table

  1. Changes
    - Add unique constraint on task_id and date columns in energy_levels table
    - Add unique constraint on goal_id and date columns in energy_levels table
    - Ensure constraints work with NULL values for task_id and goal_id
    
  2. Notes
    - The partial indexes ensure we can have unique combinations of either:
      a) task_id and date (when task_id is not null)
      b) goal_id and date (when goal_id is not null)
    - This supports the existing CHECK constraint that ensures either task_id or goal_id is set
*/

-- Create unique index for task_id and date combination
CREATE UNIQUE INDEX IF NOT EXISTS energy_levels_task_date_idx 
ON public.energy_levels (task_id, date)
WHERE task_id IS NOT NULL;

-- Create unique index for goal_id and date combination
CREATE UNIQUE INDEX IF NOT EXISTS energy_levels_goal_date_idx 
ON public.energy_levels (goal_id, date)
WHERE goal_id IS NOT NULL;