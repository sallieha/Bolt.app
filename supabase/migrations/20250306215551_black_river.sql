/*
  # Add time fields to goals table

  1. Changes
    - Add start_time column to goals table
    - Add end_time column to goals table
    - Set default values for existing rows
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'goals' AND column_name = 'start_time'
  ) THEN
    ALTER TABLE goals ADD COLUMN start_time time DEFAULT '09:00:00';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'goals' AND column_name = 'end_time'
  ) THEN
    ALTER TABLE goals ADD COLUMN end_time time DEFAULT '17:00:00';
  END IF;
END $$;