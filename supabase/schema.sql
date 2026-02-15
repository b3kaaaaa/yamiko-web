-- YAMIKO Database Schema for Supabase
-- Run this in Supabase SQL Editor

-- ============================================================
-- PROFILES (extends auth.users)
-- ============================================================

CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  banner_url TEXT,
  
  -- RPG Stats
  level INTEGER DEFAULT 1 NOT NULL,
  exp INTEGER DEFAULT 0 NOT NULL,
  rubies INTEGER DEFAULT 0 NOT NULL,
  energy INTEGER DEFAULT 100 NOT NULL,
  
  -- Role
  role TEXT DEFAULT 'USER' NOT NULL CHECK (role IN ('USER', 'ADMIN', 'MODERATOR')),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  last_login TIMESTAMPTZ
);

-- ============================================================
-- MANGA & CONTENT
-- ============================================================

CREATE TABLE IF NOT EXISTS manga (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT NOT NULL,
  cover_url TEXT NOT NULL,
  background_video TEXT,
  status TEXT DEFAULT 'ONGOING' NOT NULL CHECK (status IN ('ONGOING', 'COMPLETED', 'FROZEN', 'HIATUS')),
  rating DECIMAL(3,2) DEFAULT 0 NOT NULL,
  views INTEGER DEFAULT 0 NOT NULL,
  
  -- Metadata
  author TEXT,
  artist TEXT,
  release_year INTEGER,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS chapters (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  manga_id UUID REFERENCES manga(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  chapter_number DECIMAL(5,1) NOT NULL,
  images_urls TEXT[] NOT NULL,
  likes INTEGER DEFAULT 0 NOT NULL,
  is_locked BOOLEAN DEFAULT FALSE NOT NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  UNIQUE(manga_id, chapter_number)
);

CREATE TABLE IF NOT EXISTS genres (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS manga_genres (
  manga_id UUID REFERENCES manga(id) ON DELETE CASCADE,
  genre_id UUID REFERENCES genres(id) ON DELETE CASCADE,
  PRIMARY KEY (manga_id, genre_id)
);

CREATE TABLE IF NOT EXISTS manga_tags (
  manga_id UUID REFERENCES manga(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (manga_id, tag_id)
);

-- ============================================================
-- CARD SYSTEM
-- ============================================================

CREATE TABLE IF NOT EXISTS card_collections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT
);

CREATE TABLE IF NOT EXISTS card_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  image_url TEXT NOT NULL,
  rarity TEXT NOT NULL CHECK (rarity IN ('COMMON', 'RARE', 'SR', 'SSR', 'UR')),
  stats JSONB NOT NULL,
  collection_id UUID REFERENCES card_collections(id),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS user_cards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  card_template_id UUID REFERENCES card_templates(id) NOT NULL,
  is_locked BOOLEAN DEFAULT FALSE NOT NULL,
  obtained_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================================
-- GUILDS
-- ============================================================

CREATE TABLE IF NOT EXISTS guilds (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  level INTEGER DEFAULT 1 NOT NULL,
  exp INTEGER DEFAULT 0 NOT NULL,
  treasury INTEGER DEFAULT 0 NOT NULL,
  leader_id UUID REFERENCES profiles(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS guild_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  guild_id UUID REFERENCES guilds(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  rank TEXT DEFAULT 'MEMBER' NOT NULL CHECK (rank IN ('LEADER', 'OFFICER', 'MEMBER')),
  joined_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================================
-- SOCIAL & FORUMS
-- ============================================================

CREATE TABLE IF NOT EXISTS forum_threads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  author_id UUID REFERENCES profiles(id) NOT NULL,
  manga_id UUID REFERENCES manga(id),
  is_pinned BOOLEAN DEFAULT FALSE NOT NULL,
  is_locked BOOLEAN DEFAULT FALSE NOT NULL,
  views INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content TEXT NOT NULL,
  author_id UUID REFERENCES profiles(id) NOT NULL,
  thread_id UUID REFERENCES forum_threads(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES comments(id),
  likes INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================================
-- TRANSACTIONS & ECONOMY
-- ============================================================

CREATE TABLE IF NOT EXISTS transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('PURCHASE_RUBIES', 'PURCHASE_CARD_PACK', 'MARKET_SALE', 'MARKET_PURCHASE', 'GUILD_DONATION', 'DAILY_REWARD', 'ACHIEVEMENT_REWARD', 'ADMIN_GRANT')),
  amount INTEGER NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================================
-- ACHIEVEMENTS
-- ============================================================

CREATE TABLE IF NOT EXISTS achievements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT NOT NULL,
  icon_url TEXT NOT NULL,
  exp_reward INTEGER DEFAULT 0 NOT NULL,
  rubies_reward INTEGER DEFAULT 0 NOT NULL
);

CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  achievement_id UUID REFERENCES achievements(id) NOT NULL,
  unlocked_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, achievement_id)
);

-- ============================================================
-- LIBRARY & READING HISTORY
-- ============================================================

CREATE TABLE IF NOT EXISTS library_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  manga_id UUID REFERENCES manga(id) ON DELETE CASCADE NOT NULL,
  is_favorite BOOLEAN DEFAULT FALSE NOT NULL,
  status TEXT DEFAULT 'READING' NOT NULL,
  added_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, manga_id)
);

CREATE TABLE IF NOT EXISTS reading_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  manga_id UUID REFERENCES manga(id) ON DELETE CASCADE NOT NULL,
  chapter_id UUID REFERENCES chapters(id) ON DELETE CASCADE NOT NULL,
  progress DECIMAL(5,2) DEFAULT 0 NOT NULL,
  last_read_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, chapter_id)
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_manga_slug ON manga(slug);
CREATE INDEX IF NOT EXISTS idx_manga_rating ON manga(rating DESC);
CREATE INDEX IF NOT EXISTS idx_manga_views ON manga(views DESC);
CREATE INDEX IF NOT EXISTS idx_chapters_manga_id ON chapters(manga_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_forum_threads_author_id ON forum_threads(author_id);
CREATE INDEX IF NOT EXISTS idx_comments_thread_id ON comments(thread_id);

-- ============================================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_manga_updated_at BEFORE UPDATE ON manga
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chapters_updated_at BEFORE UPDATE ON chapters
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_forum_threads_updated_at BEFORE UPDATE ON forum_threads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
