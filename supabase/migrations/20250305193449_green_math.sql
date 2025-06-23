/*
  # Create initial schema for habit tracker

  1. New Tables
    - `goals`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `title` (text)
      - `description` (text, nullable)
      - `color` (text)
      - `frequency` (text[])
      - `start_date` (date)
      - `created_at` (timestamptz)

    - `goal_completions`
      - `id` (uuid, primary key)
      - `goal_id` (uuid, references goals)
      - `user_id` (uuid, references auth.users)
      - `completed_date` (date)
      - `created_at` (timestamptz)

    - `goal_misses`
      - `id` (uuid, primary key)
      - `goal_id` (uuid, references goals)
      - `user_id` (uuid, references auth.users)
      - `missed_date` (date)
      - `reason` (text)
      - `improvement_plan` (text)
      - `created_at` (timestamptz)

    - `moods`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `mood` (text)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
*/

-- Goals table
CREATE TABLE IF NOT EXISTS goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  title text NOT NULL,
  description text,
  color text NOT NULL,
  frequency text[] NOT NULL,
  start_date date NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own goals"
  ON goals
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Goal completions table
CREATE TABLE IF NOT EXISTS goal_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id uuid REFERENCES goals ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users NOT NULL,
  completed_date date NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(goal_id, completed_date)
);

ALTER TABLE goal_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own goal completions"
  ON goal_completions
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Goal misses table
CREATE TABLE IF NOT EXISTS goal_misses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id uuid REFERENCES goals ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users NOT NULL,
  missed_date date NOT NULL,
  reason text,
  improvement_plan text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(goal_id, missed_date)
);

ALTER TABLE goal_misses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own missed goals"
  ON goal_misses
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Moods table
CREATE TABLE IF NOT EXISTS moods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  mood text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE moods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own moods"
  ON moods
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_goals_user ON goals(user_id);
CREATE INDEX IF NOT EXISTS idx_completions_user_date ON goal_completions(user_id, completed_date);
CREATE INDEX IF NOT EXISTS idx_misses_user_date ON goal_misses(user_id, missed_date);
CREATE INDEX IF NOT EXISTS idx_moods_user_created ON moods(user_id, created_at);