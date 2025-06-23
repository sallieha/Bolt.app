/*
  # Add hourly energy level tracking

  1. New Tables
    - `hourly_energy_levels`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `hour` (integer, 0-23)
      - `level` (integer, 1-5)
      - `date` (date)
      - `notes` (text, optional)
      - `recorded_at` (timestamp)

  2. Security
    - Enable RLS
    - Add policy for authenticated users to manage their own energy levels
    - Add unique constraint for user-date-hour combination

  3. Notes
    - Each user can only have one energy level per hour per day
    - Hours must be between 0 and 23
    - Energy levels must be between 1 and 5
*/

-- Create hourly_energy_levels table
CREATE TABLE hourly_energy_levels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  hour integer NOT NULL CHECK (hour >= 0 AND hour < 24),
  level integer NOT NULL CHECK (level >= 1 AND level <= 5),
  date date NOT NULL DEFAULT CURRENT_DATE,
  notes text,
  recorded_at timestamptz DEFAULT now(),
  CONSTRAINT hourly_energy_levels_hour_date_key UNIQUE (user_id, date, hour)
);

-- Create index for better query performance
CREATE INDEX idx_hourly_energy_levels_user_date 
ON hourly_energy_levels (user_id, date);

-- Enable RLS
ALTER TABLE hourly_energy_levels ENABLE ROW LEVEL SECURITY;

-- Create RLS policy
CREATE POLICY "Users can manage their own hourly energy levels"
ON hourly_energy_levels
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);