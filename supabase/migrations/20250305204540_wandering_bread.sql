/*
  # Add end date to goals table

  1. Changes
    - Add optional end_date column to goals table
    - Add check constraint to ensure end_date is after start_date

  2. Notes
    - end_date is nullable to support goals without an end date
    - Check constraint ensures data integrity
*/

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'goals' AND column_name = 'end_date'
  ) THEN
    ALTER TABLE goals ADD COLUMN end_date date;
    
    -- Add check constraint to ensure end_date is after start_date when present
    ALTER TABLE goals ADD CONSTRAINT goals_dates_check 
      CHECK (end_date IS NULL OR end_date > start_date);
  END IF;
END $$;