-- Supabase Schema for Proxie Feed

-- 1. Users Table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  avatar TEXT,
  role TEXT
);

-- 2. Stories Table
CREATE TABLE stories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  image_url TEXT,
  is_unread BOOLEAN DEFAULT false,
  is_selected BOOLEAN DEFAULT false
);

-- 3. Highlights Table
CREATE TABLE highlights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  image_url TEXT
);

-- 4. Posts Table
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  author_id UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_important BOOLEAN DEFAULT false,
  content TEXT NOT NULL,
  image_url TEXT,
  reactions JSONB DEFAULT '{}'::jsonb
);

-- 5. Learning Progress Table
CREATE TABLE learning_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  title TEXT NOT NULL,
  status TEXT NOT NULL,
  image_url TEXT
);

-- Insert Dummy Data --

-- Users
INSERT INTO users (id, name, avatar, role) VALUES 
('11111111-1111-1111-1111-111111111111', 'John Miller', '/dmmy%20image.jpg', 'Plymouth'),
('22222222-2222-2222-2222-222222222222', 'Jane Doe', '/dmmy%20image.jpg', 'Woolwich');

-- Stories
INSERT INTO stories (title, image_url, is_selected, is_unread) VALUES
('For you', '/dmmy%20image.jpg', true, false),
('News', '/dummy%20image%202.jpg', false, true),
('Managers', '/dmmy%20image.jpg', false, false),
('Plymouth', '/dummy%20image%202.jpg', false, false),
('HQ', '/dmmy%20image.jpg', false, false);

-- Highlights
INSERT INTO highlights (title, image_url) VALUES
('New Menu!', '/dmmy%20image.jpg'),
('Code of conduct', '/dummy%20image%202.jpg'),
('Safety Guidelines', '/dmmy%20image.jpg'),
('Upcoming Events', '/dummy%20image%202.jpg');

-- Posts
INSERT INTO posts (author_id, is_important, content, image_url, reactions) VALUES
('11111111-1111-1111-1111-111111111111', false, 'Are we ready for another great day?! 🔥 🍗', '/dummy%20image%203.jpeg', '{"thumbsUp": 1, "comments": 0, "views": 1, "heart": 2, "smile": 1, "celebrate": 1, "laugh": 1}'),
('22222222-2222-2222-2222-222222222222', false, 'Big thanks to everyone who stepped up, stayed flexible, or helped cover a shift this week.\n\nThat teamwork doesn''t go unnoticed 💪', NULL, '{"thumbsUp": 1, "comments": 1, "views": 0, "heart": 2, "celebrate": 1, "laugh": 1}');

-- Learning Progress
INSERT INTO learning_progress (user_id, title, status, image_url) VALUES
('11111111-1111-1111-1111-111111111111', 'Food Safety Level 1', 'In Progress', '/dmmy%20image.jpg');
