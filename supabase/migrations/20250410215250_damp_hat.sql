/*
  # Add hourly energy levels table if not exists

  1. Changes
    - Add check for table existence before creation
    - Create hourly_energy_levels table if it doesn't exist
    - Add appropriate constraints and indexes
    - Enable RLS and add policies

  2. Notes
    - Uses DO block to safely check for table existence
    - Maintains all original functionality while avoiding duplicate table error
*/

DO $$ 
BEGIN
  -- Only create table if it doesn't exist
  IF NOT EXISTS (
    SELECT FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'hourly_energy_levels'
  ) THEN
    -- Create the hourly energy levels table
    CREATE TABLE public.hourly_energy_levels (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid REFERENCES auth.users NOT NULL,
      hour integer NOT NULL,
      level integer NOT NULL,
      date date NOT NULL DEFAULT CURRENT_DATE,
      notes text,
      recorded_at timestamptz DEFAULT now() NOT NULL,
      CONSTRAINT hourly_energy_levels_hour_check CHECK (hour >= 0 AND hour <= 23),
      CONSTRAINT hourly_energy_levels_level_check CHECK (level >= 1 AND level <= 5),
      CONSTRAINT hourly_energy_levels_unique_entry UNIQUE (user_id, date, hour)
    );

    -- Create index for efficient querying
    CREATE INDEX idx_hourly_energy_levels_user_date 
    ON public.hourly_energy_levels (user_id, date);

    -- Enable Row Level Security
    ALTER TABLE public.hourly_energy_levels ENABLE ROW LEVEL SECURITY;

    -- Create policies for data access
    CREATE POLICY "Users can manage their own hourly energy levels"
    ON public.hourly_energy_levels
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;