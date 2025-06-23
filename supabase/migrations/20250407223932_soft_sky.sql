/*
  # Add avatar support and activity feed

  1. New Tables
    - `avatars`
      - `id` (uuid, primary key)
      - `name` (text)
      - `emoji` (text)
      - `color` (text)
    
    - `user_profiles`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `avatar_id` (uuid, references avatars)
      - `created_at` (timestamp)
    
    - `activity_feed`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `avatar_id` (uuid, references avatars)
      - `action` (text)
      - `goal` (text)
      - `streak` (integer)
      - `milestone` (text)
      - `target` (text)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create avatars table
CREATE TABLE avatars (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  emoji text NOT NULL,
  color text NOT NULL
);

ALTER TABLE avatars ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Avatars are viewable by all users"
  ON avatars
  FOR SELECT
  TO authenticated
  USING (true);

-- Insert default avatars
INSERT INTO avatars (name, emoji, color) VALUES
  ('Happy Fox', '🦊', '#ff9933'),
  ('Cool Penguin', '🐧', '#3366ff'),
  ('Party Owl', '🦉', '#9933ff'),
  ('Friendly Bear', '🐻', '#cc6633'),
  ('Wise Elephant', '🐘', '#666699'),
  ('Lucky Cat', '🐱', '#ff6699'),
  ('Brave Lion', '🦁', '#ffcc33'),
  ('Smart Dolphin', '🐬', '#33ccff'),
  ('Peaceful Koala', '🐨', '#99cc33'),
  ('Playful Monkey', '🐵', '#cc9933');

-- Create user_profiles table
CREATE TABLE user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  avatar_id uuid REFERENCES avatars NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own profile"
  ON user_profiles
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create activity_feed table
CREATE TABLE activity_feed (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  avatar_id uuid REFERENCES avatars NOT NULL,
  action text NOT NULL,
  goal text NOT NULL,
  streak integer,
  milestone text,
  target text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE activity_feed ENABLE ROW LEVEL SECURITY;

-- Everyone can view activity feed
CREATE POLICY "Activity feed is viewable by all users"
  ON activity_feed
  FOR SELECT
  TO authenticated
  USING (true);

-- Users can only create their own activities
CREATE POLICY "Users can create their own activities"
  ON activity_feed
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for better query performance
CREATE INDEX idx_user_profiles_user ON user_profiles(user_id);
CREATE INDEX idx_activity_feed_created ON activity_feed(created_at DESC);