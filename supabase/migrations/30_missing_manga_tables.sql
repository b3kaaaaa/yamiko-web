-- Migration: 30_missing_manga_tables.sql
-- Description: Creates missing tables for Manga, Chapters, and User Library
-- Author: Yamiko Backend

-- ==========================================
-- 1. MANGA & CHAPTERS
-- ==========================================

CREATE TABLE IF NOT EXISTS manga (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    cover_url TEXT,
    description TEXT,
    rating NUMERIC(3, 2) DEFAULT 0,
    views BIGINT DEFAULT 0,
    status TEXT DEFAULT 'ONGOING', -- ONGOING, COMPLETED, HIATUS
    type TEXT DEFAULT 'MANHWA', -- MANHWA, MANGA, MANHUA
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chapters (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    manga_id UUID REFERENCES manga(id) ON DELETE CASCADE,
    title TEXT,
    number NUMERIC(10, 2) NOT NULL,
    slug TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chapters_manga_id ON chapters(manga_id);

-- ==========================================
-- 2. TAXONOMY (Genres & Tags)
-- ==========================================

CREATE TABLE IF NOT EXISTS genres (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    slug TEXT UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS manga_genres (
    manga_id UUID REFERENCES manga(id) ON DELETE CASCADE,
    genre_id UUID REFERENCES genres(id) ON DELETE CASCADE,
    PRIMARY KEY (manga_id, genre_id)
);

CREATE TABLE IF NOT EXISTS tags (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    slug TEXT UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS manga_tags (
    manga_id UUID REFERENCES manga(id) ON DELETE CASCADE,
    tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (manga_id, tag_id)
);

-- ==========================================
-- 3. USER INTERACTION (Library & History)
-- ==========================================

-- Replaces 'bookmarks'
CREATE TABLE IF NOT EXISTS library_entries (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    manga_id UUID REFERENCES manga(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'READING', -- READING, COMPLETED, PLAN_TO_READ, DROPPED, ON_HOLD
    progress INTEGER DEFAULT 0, -- Last chapter read (number or count?) Let's assume most recent chapter number for now or count.
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, manga_id)
);

CREATE TABLE IF NOT EXISTS reading_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    chapter_id UUID REFERENCES chapters(id) ON DELETE CASCADE,
    read_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reading_history_user_id ON reading_history(user_id);
CREATE INDEX IF NOT EXISTS idx_reading_history_chapter_id ON reading_history(chapter_id);

-- ==========================================
-- 4. SEED DATA (Optional, verifies structure)
-- ==========================================
-- Insert some test genres if empty
INSERT INTO genres (name, slug) VALUES 
('Action', 'action'), ('Romance', 'romance'), ('Fantasy', 'fantasy'), ('Adventure', 'adventure')
ON CONFLICT DO NOTHING;
