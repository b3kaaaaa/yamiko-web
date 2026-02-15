-- PERFORMANCE INDEXES 
-- Run this script in the Supabase SQL Editor to speed up queries

-- 1. Index for "New Releases" (sorting by created_at)
CREATE INDEX IF NOT EXISTS idx_manga_created_at ON manga (created_at DESC);

-- 2. Index for "Popular/Hero" (sorting by views)
CREATE INDEX IF NOT EXISTS idx_manga_views ON manga (views DESC);

-- 3. Index for "Top Users" (sorting by exp)
CREATE INDEX IF NOT EXISTS idx_profiles_exp ON profiles (exp DESC);

-- 4. Index for Foreign Keys (often used in joins/filters)
CREATE INDEX IF NOT EXISTS idx_manga_genres_manga_id ON manga_genres (manga_id);
CREATE INDEX IF NOT EXISTS idx_manga_genres_genre_id ON manga_genres (genre_id);
CREATE INDEX IF NOT EXISTS idx_chapters_manga_id ON chapters (manga_id);

-- 5. Index for Search (if not using Full Text Search yet, this helps ILIKE slightly or exact match)
CREATE INDEX IF NOT EXISTS idx_manga_title ON manga (title);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles (username);
