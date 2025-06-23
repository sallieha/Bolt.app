/*
  # Create avatars table and add initial data

  1. New Tables
    - `avatars`
      - `id` (uuid, primary key)
      - `name` (text, not null)
      - `emoji` (text, not null)
      - `color` (text, not null)

  2. Security
    - Enable RLS on `avatars` table
    - Add policy for authenticated users to view avatars (if not exists)

  3. Initial Data
    - Add a set of default avatars with various emojis and colors
*/

-- Create avatars table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.avatars (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  emoji text NOT NULL,
  color text NOT NULL
);

-- Enable RLS
ALTER TABLE public.avatars ENABLE ROW LEVEL SECURITY;

-- Create policy if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'avatars' 
    AND policyname = 'Avatars are viewable by all users'
  ) THEN
    CREATE POLICY "Avatars are viewable by all users"
      ON public.avatars
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;

-- Insert initial avatars
INSERT INTO public.avatars (name, emoji, color)
VALUES
  ('Happy Fox', '🦊', '#ff9f43'),
  ('Cool Cat', '😺', '#45aaf2'),
  ('Party Panda', '🐼', '#2d98da'),
  ('Lucky Unicorn', '🦄', '#a55eea'),
  ('Wise Owl', '🦉', '#8854d0'),
  ('Brave Lion', '🦁', '#fa8231'),
  ('Playful Penguin', '🐧', '#0fb9b1'),
  ('Magic Dragon', '🐲', '#20bf6b'),
  ('Sweet Koala', '🐨', '#778ca3'),
  ('Friendly Dolphin', '🐬', '#2bcbba')
ON CONFLICT (id) DO NOTHING;