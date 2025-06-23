/*
  # Add Daily Planner Schema

  1. New Tables
    - `daily_tasks`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `content` (text)
      - `start_time` (time)
      - `end_time` (time)
      - `created_at` (timestamp)
      - `date` (date)

  2. Security
    - Enable RLS on daily_tasks table
    - Add policy for authenticated users to manage their own tasks
*/

CREATE TABLE IF NOT EXISTS daily_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  content text NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE daily_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own daily tasks"
  ON daily_tasks
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_daily_tasks_user_date 
  ON daily_tasks(user_id, date);