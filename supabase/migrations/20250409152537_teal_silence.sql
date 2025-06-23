/*
  # Update energy levels table to make task_id optional

  1. Changes
    - Make task_id column nullable
    - Add date column to track energy levels independently
    - Update unique constraint to consider both task_id and date

  2. Security
    - Maintain existing RLS policies
*/

-- First drop the existing unique constraint
ALTER TABLE energy_levels DROP CONSTRAINT IF EXISTS energy_levels_task_id_key;

-- Make task_id nullable and add date column
ALTER TABLE energy_levels 
  ALTER COLUMN task_id DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS date date NOT NULL DEFAULT CURRENT_DATE;

-- Add new unique constraint that considers both task_id and date
ALTER TABLE energy_levels
  ADD CONSTRAINT energy_levels_task_date_key 
  UNIQUE (task_id, date) 
  DEFERRABLE INITIALLY DEFERRED;

-- Update the index for better query performance
DROP INDEX IF EXISTS idx_energy_levels_user_recorded;
CREATE INDEX idx_energy_levels_user_date ON energy_levels(user_id, date);