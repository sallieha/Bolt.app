/*
  # Add goal_id column to energy_levels table

  1. Changes
    - Add goal_id column to energy_levels table
    - Add index for goal_id and date combination
    - Update RLS policy to include goal_id checks

  2. Security
    - Maintain existing RLS policies
    - Ensure users can only access their own energy levels
*/

-- Add goal_id column
ALTER TABLE energy_levels
ADD COLUMN IF NOT EXISTS goal_id uuid REFERENCES goals(id) ON DELETE CASCADE;

-- Add index for goal_id and date combination for better query performance
CREATE INDEX IF NOT EXISTS idx_energy_levels_goal_date
ON energy_levels (goal_id, date);

-- Update RLS policy to include goal_id checks
DROP POLICY IF EXISTS "Users can manage their own energy levels" ON energy_levels;

CREATE POLICY "Users can manage their own energy levels"
ON energy_levels
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);