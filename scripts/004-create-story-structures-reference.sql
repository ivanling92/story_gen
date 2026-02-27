-- Create reference table for story structures and their beat points
CREATE TABLE IF NOT EXISTS story_structures (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  beat_points JSONB NOT NULL -- Store structure beats as JSON
);

-- Insert predefined story structures
INSERT INTO story_structures (name, description, beat_points) VALUES
('freytag', 'Freytag''s Pyramid', '{"beats": ["exposition", "rising_action", "climax", "falling_action", "resolution"], "chapter_mapping": [1, 3, 4, 6, 8]}'),
('hero_journey', 'The Hero''s Journey', '{"beats": ["ordinary_world", "call_to_adventure", "refusal", "mentor", "crossing_threshold", "tests", "ordeal", "reward", "road_back", "resurrection", "return"], "chapter_mapping": [1, 1, 2, 2, 3, 4, 5, 6, 7, 7, 8]}'),
('three_act', 'Three Act Structure', '{"beats": ["setup", "confrontation", "resolution"], "chapter_mapping": [2, 5, 1]}'),
('dan_harmon', 'Dan Harmon''s Story Circle', '{"beats": ["you", "need", "go", "search", "find", "take", "return", "change"], "chapter_mapping": [1, 1, 2, 3, 4, 5, 6, 8]}'),
('fichtean', 'Fichtean Curve', '{"beats": ["inciting_incident", "crisis_1", "crisis_2", "crisis_3", "climax", "falling_action"], "chapter_mapping": [1, 2, 4, 6, 7, 8]}'),
('save_cat', 'Save the Cat Beat Sheet', '{"beats": ["opening_image", "setup", "catalyst", "debate", "break_into_two", "b_story", "fun_games", "midpoint", "bad_guys_close_in", "all_is_lost", "dark_night", "break_into_three", "finale", "final_image"], "chapter_mapping": [1, 1, 2, 2, 3, 4, 4, 5, 6, 6, 7, 7, 8, 8]}'),
('seven_point', 'Seven-Point Story Structure', '{"beats": ["hook", "plot_turn_1", "pinch_point_1", "midpoint", "pinch_point_2", "plot_turn_2", "resolution"], "chapter_mapping": [1, 2, 3, 4, 5, 6, 8]}')
ON CONFLICT (name) DO NOTHING;
