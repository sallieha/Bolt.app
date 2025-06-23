/*
  # Add unique constraints for energy levels

  1. Changes
    - Add unique constraint for goal-based energy levels (goal_id, date, user_id)
    - Add unique constraint for task-based energy levels (task_id, date, user_id)
    - Both constraints allow nulls to handle the mutually exclusive nature of goal_id and task_id

  2. Purpose
    - Ensures no duplicate energy level entries for the same goal/task, date, and user
    - Supports upsert operations in the energy level store
    - Maintains data integrity by preventing duplicate records
*/

-- Add unique constraint for goal-based energy levels
ALTER TABLE energy_levels
ADD CONSTRAINT unique_energy_level_goal 
UNIQUE NULLS NOT DISTINCT (goal_id, date, user_id);

-- Add unique constraint for task-based energy levels
ALTER TABLE energy_levels
ADD CONSTRAINT unique_energy_level_task 
UNIQUE NULLS NOT DISTINCT (task_id, date, user_id);