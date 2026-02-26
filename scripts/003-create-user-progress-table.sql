-- Create user progress table to track reading progress
CREATE TABLE IF NOT EXISTS user_progress (
  id SERIAL PRIMARY KEY,
  user_id TEXT REFERENCES neon_auth.users_sync(id),
  story_id INTEGER REFERENCES stories(id) ON DELETE CASCADE,
  current_chapter INTEGER DEFAULT 1,
  last_read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reading_position INTEGER DEFAULT 0, -- Character position in current chapter
  
  -- Ensure one progress record per user per story
  UNIQUE(user_id, story_id)
);

-- Create index for user progress lookups
CREATE INDEX IF NOT EXISTS idx_user_progress_user_story ON user_progress(user_id, story_id);
