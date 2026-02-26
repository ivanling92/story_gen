-- Create stories table
CREATE TABLE IF NOT EXISTS stories (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    summary TEXT NOT NULL,
    genre VARCHAR(100) NOT NULL,
    structure_type VARCHAR(100) NOT NULL,
    total_chapters INTEGER DEFAULT 8,
    current_chapter INTEGER DEFAULT 1,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create chapters table
CREATE TABLE IF NOT EXISTS chapters (
    id SERIAL PRIMARY KEY,
    story_id INTEGER REFERENCES stories(id) ON DELETE CASCADE,
    chapter_number INTEGER NOT NULL,
    title VARCHAR(255),
    content TEXT NOT NULL,
    summary TEXT,
    word_count INTEGER,
    structure_beat VARCHAR(100),
    status VARCHAR(50) DEFAULT 'published',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(story_id, chapter_number)
);

-- Create user_progress table
CREATE TABLE IF NOT EXISTS user_progress (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    story_id INTEGER REFERENCES stories(id) ON DELETE CASCADE,
    current_chapter INTEGER DEFAULT 1,
    reading_position INTEGER DEFAULT 0,
    completed BOOLEAN DEFAULT FALSE,
    last_read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, story_id)
);

-- Create story_structures table
CREATE TABLE IF NOT EXISTS story_structures (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    beats JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert story structure data
INSERT INTO story_structures (name, description, beats) VALUES
('freytag_pyramid', 'Classic dramatic structure with exposition, rising action, climax, falling action, and resolution', 
 '["exposition", "inciting_incident", "rising_action", "climax", "falling_action", "resolution", "denouement", "conclusion"]'),
('hero_journey', 'Joseph Campbell''s monomyth structure following the hero''s transformative adventure',
 '["ordinary_world", "call_to_adventure", "refusal_of_call", "meeting_mentor", "crossing_threshold", "tests_allies_enemies", "ordeal", "reward"]'),
('three_act', 'Simple three-act structure with setup, confrontation, and resolution',
 '["setup", "inciting_incident", "plot_point_1", "confrontation", "midpoint", "plot_point_2", "climax", "resolution"]'),
('story_circle', 'Dan Harmon''s simplified hero''s journey in eight steps',
 '["comfort_zone", "want", "unfamiliar_situation", "adapt", "find", "heavy_price", "return", "change"]'),
('fichtean_curve', 'Structure focused on rising tension through multiple crises',
 '["inciting_incident", "rising_action_crisis_1", "rising_action_crisis_2", "climax", "falling_action", "resolution", "denouement", "conclusion"]'),
('save_the_cat', 'Blake Snyder''s beat sheet for screenwriting adapted for novels',
 '["opening_image", "setup", "catalyst", "debate", "break_into_two", "b_story", "midpoint", "finale"]'),
('seven_point', 'Dan Wells'' structure starting with the ending and working backwards',
 '["hook", "plot_turn_1", "pinch_point_1", "midpoint", "pinch_point_2", "plot_turn_2", "resolution", "conclusion"]')
ON CONFLICT (name) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_stories_genre ON stories(genre);
CREATE INDEX IF NOT EXISTS idx_stories_status ON stories(status);
CREATE INDEX IF NOT EXISTS idx_chapters_story_id ON chapters(story_id);
CREATE INDEX IF NOT EXISTS idx_chapters_story_chapter ON chapters(story_id, chapter_number);
CREATE INDEX IF NOT EXISTS idx_user_progress_user_story ON user_progress(user_id, story_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_story ON user_progress(story_id);
