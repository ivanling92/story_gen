-- Create chapters table to store individual chapter content
CREATE TABLE IF NOT EXISTS chapters (
  id SERIAL PRIMARY KEY,
  story_id INTEGER REFERENCES stories(id) ON DELETE CASCADE,
  chapter_number INTEGER NOT NULL,
  title VARCHAR(255),
  content TEXT NOT NULL,
  summary TEXT, -- Summary of this chapter for generating next chapters
  word_count INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'draft', -- 'draft', 'generated', 'displayed'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure unique chapter numbers per story
  UNIQUE(story_id, chapter_number)
);

-- Create indexes for efficient chapter retrieval
CREATE INDEX IF NOT EXISTS idx_chapters_story_id ON chapters(story_id);
CREATE INDEX IF NOT EXISTS idx_chapters_story_chapter ON chapters(story_id, chapter_number);
