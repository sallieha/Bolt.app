/*
  # Add performance indexes

  1. Changes
    - Add indexes for better query performance on frequently accessed columns
      - moods: (user_id, created_at)
      - goals: (user_id)
      - goal_completions: (user_id, completed_date)

  2. Notes
    - These indexes will improve query performance for:
      - Fetching user-specific data
      - Date-range queries
      - Goal completion lookups
*/

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_moods_user_created ON moods (user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_goals_user ON goals (user_id);
CREATE INDEX IF NOT EXISTS idx_completions_user_date ON goal_completions (user_id, completed_date);