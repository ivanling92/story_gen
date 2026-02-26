-- Create stories table to store story metadata
CREATE TABLE IF NOT EXISTS stories (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  summary TEXT NOT NULL,
  genre VARCHAR(100) NOT NULL,
  structure_type VARCHAR(50) NOT NULL, -- 'freytag', 'hero_journey', 'three_act', etc.
  total_chapters INTEGER DEFAULT 8,
  current_chapter INTEGER DEFAULT 1,
  status VARCHAR(20) DEFAULT 'active', -- 'active', 'completed', 'abandoned'
  user_id TEXT REFERENCES neon_auth.users_sync(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster user story lookups
CREATE INDEX IF NOT EXISTS idx_stories_user_id ON stories(user_id);
CREATE INDEX IF NOT EXISTS idx_stories_status ON stories(status);
