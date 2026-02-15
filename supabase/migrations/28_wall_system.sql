-- 28_wall_system.sql

CREATE TABLE IF NOT EXISTS wall_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL, -- Owner of the wall
  author_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL, -- Poster
  content TEXT NOT NULL CHECK (length(content) > 0 AND length(content) <= 1000),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE wall_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public Read: Wall" ON wall_posts FOR SELECT USING (true);
CREATE POLICY "Authenticated Post: Wall" ON wall_posts FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Owner/Author Delete: Wall" ON wall_posts FOR DELETE USING (auth.uid() = user_id OR auth.uid() = author_id);

-- Index
CREATE INDEX idx_wall_posts_user ON wall_posts(user_id);
CREATE INDEX idx_wall_posts_created ON wall_posts(created_at DESC);
