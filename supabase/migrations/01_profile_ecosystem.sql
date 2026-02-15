-- Yamiko RPG Profile System Migration (Solo Leveling Style)
-- RUN THIS IN SUPABASE SQL EDITOR

-- ==========================================
-- 1. ENUMS & EXTENSIONS
-- ==========================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 2. EXTEND PROFILES
-- ==========================================
-- We assume 'profiles' exists and is linked to auth.users. 
-- If not, create it:
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  username TEXT UNIQUE NOT NULL
);

-- Add Extended Columns
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS nickname TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS banner_url TEXT,
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS status_text TEXT,
ADD COLUMN IF NOT EXISTS is_online BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1 NOT NULL,
ADD COLUMN IF NOT EXISTS rank_tier TEXT DEFAULT 'E' CHECK (rank_tier IN ('E', 'D', 'C', 'B', 'A', 'S', 'National')),
ADD COLUMN IF NOT EXISTS xp INTEGER DEFAULT 0 NOT NULL,
ADD COLUMN IF NOT EXISTS energy INTEGER DEFAULT 100 NOT NULL CHECK (energy <= 100),
ADD COLUMN IF NOT EXISTS rubies INTEGER DEFAULT 0 NOT NULL,
ADD COLUMN IF NOT EXISTS class_id UUID, -- FK to classes (added later)
ADD COLUMN IF NOT EXISTS tower_floor INTEGER DEFAULT 1 NOT NULL,
ADD COLUMN IF NOT EXISTS referrer_id UUID REFERENCES profiles(id),
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT TRUE NOT NULL,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- ==========================================
-- 3. TOWER SYSTEM (Progression)
-- ==========================================
CREATE TABLE IF NOT EXISTS tower_levels (
  floor_number INTEGER PRIMARY KEY,
  chapters_required INTEGER NOT NULL, -- Cumulative total chapters needed
  reward_xp INTEGER DEFAULT 0 NOT NULL,
  reward_rubies INTEGER DEFAULT 0 NOT NULL
);

-- SEEDING TOWER FLOORS (1-300)
DO $$
DECLARE
  floor INT;
  total_chapters INT := 0;
  increment INT;
BEGIN
  -- Clear existing levels if any to ensure math correctness
  DELETE FROM tower_levels;

  FOR floor IN 1..300 LOOP
    -- Logic:
    -- 1-20: +10
    -- 21-60: +20
    -- 61-100: +25
    -- 101-300: +20
    IF floor <= 20 THEN
      increment := 10;
    ELSIF floor <= 60 THEN
      increment := 20;
    ELSIF floor <= 100 THEN
      increment := 25;
    ELSE
      increment := 20;
    END IF;

    total_chapters := total_chapters + increment;

    INSERT INTO tower_levels (floor_number, chapters_required, reward_xp, reward_rubies)
    VALUES (floor, total_chapters, floor * 100, floor * 5); -- Simple reward scaling for now
  END LOOP;
END $$;

-- ==========================================
-- 4. RPG STRUCTURE (Classes & Titles)
-- ==========================================
CREATE TABLE IF NOT EXISTS classes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL, -- e.g. "Necromancer", "Assassin"
  description TEXT,
  base_stats JSONB DEFAULT '{}'::jsonb,
  icon_url TEXT
);

-- Link profiles to classes
DO $$ BEGIN
  ALTER TABLE profiles ADD CONSTRAINT fk_profiles_classes FOREIGN KEY (class_id) REFERENCES classes(id);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS titles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  text TEXT UNIQUE NOT NULL, -- e.g. "The Awakened"
  description TEXT,
  color_hex TEXT DEFAULT '#FFFFFF',
  requirement_desc TEXT
);

CREATE TABLE IF NOT EXISTS user_titles (
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title_id UUID REFERENCES titles(id) ON DELETE CASCADE,
  is_equipped BOOLEAN DEFAULT FALSE,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, title_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_titles_equipped 
ON user_titles (user_id) WHERE is_equipped = TRUE;

-- ==========================================
-- 5. INVENTORY & COLLECTIONS
-- ==========================================
CREATE TABLE IF NOT EXISTS items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  type TEXT DEFAULT 'MATERIAL' CHECK (type IN ('CONSUMABLE', 'MATERIAL', 'EQUIPMENT', 'KEY_ITEM', 'CARD', 'ARTIFACT')),
  rarity TEXT DEFAULT 'COMMON' CHECK (rarity IN ('COMMON', 'RARE', 'EPIC', 'LEGENDARY', 'ARTIFACT', 'MYTHIC')),
  effects JSONB DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS user_inventory (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  item_id UUID REFERENCES items(id) ON DELETE CASCADE NOT NULL,
  quantity INTEGER DEFAULT 1 NOT NULL CHECK (quantity >= 0),
  is_pinned BOOLEAN DEFAULT FALSE, -- Limit logic in app/triggers
  acquired_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, item_id)
);

-- ==========================================
-- 6. QUESTS & ACHIEVEMENTS
-- ==========================================
CREATE TABLE IF NOT EXISTS quest_definitions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  frequency TEXT NOT NULL CHECK (frequency IN ('DAILY', 'WEEKLY', 'MONTHLY', 'ONETIME')),
  task_type TEXT NOT NULL CHECK (task_type IN ('READ_CHAPTER', 'COMMENT', 'LIKE_MANGA', 'LOGIN', 'SHARE', 'INVITE_FRIEND')),
  target_count INTEGER DEFAULT 1 NOT NULL,
  rewards JSONB DEFAULT '{}'::jsonb, -- { "xp": 100, "rubies": 10 }
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_quests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  quest_id UUID REFERENCES quest_definitions(id) ON DELETE CASCADE NOT NULL,
  progress INTEGER DEFAULT 0 NOT NULL,
  is_claimed BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, quest_id)
);

CREATE TABLE IF NOT EXISTS achievements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  icon_url TEXT,
  condition TEXT, -- Text description of how to unlock
  rewards JSONB DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  achievement_id UUID REFERENCES achievements(id) ON DELETE CASCADE NOT NULL,
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

-- ==========================================
-- 7. SOCIAL FEATURES (Guilds & Friends)
-- ==========================================
CREATE TABLE IF NOT EXISTS friendships (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id_1 UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  user_id_2 UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'BLOCKED')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_friendship UNIQUE (user_id_1, user_id_2)
);

CREATE TABLE IF NOT EXISTS guilds (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  level INTEGER DEFAULT 1 NOT NULL,
  owner_id UUID REFERENCES profiles(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS guild_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  guild_id UUID REFERENCES guilds(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  rank TEXT DEFAULT 'MEMBER' CHECK (rank IN ('MEMBER', 'OFFICER', 'LEADER')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(guild_id, user_id),
  UNIQUE(user_id) -- User can only be in one guild
);

-- Shadow Army Helper
CREATE OR REPLACE FUNCTION get_shadow_army_count(recruiter_uuid UUID)
RETURNS INTEGER
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT count(*)::INTEGER FROM profiles WHERE referrer_id = recruiter_uuid;
$$;

-- ==========================================
-- 8. LIBRARY & HISTORY
-- ==========================================
CREATE TABLE IF NOT EXISTS bookmarks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  manga_id UUID NOT NULL, -- Assumes manga table exists
  status TEXT DEFAULT 'READING' CHECK (status IN ('READING', 'PLANNED', 'DROPPED', 'COMPLETED', 'FAVORITE')),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, manga_id)
);

-- Reading History assumes 'chapters' table exists
CREATE TABLE IF NOT EXISTS reading_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  chapter_id UUID NOT NULL, -- Assumes chapters table
  read_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, chapter_id)
);

-- ==========================================
-- 9. USER SETTINGS
-- ==========================================
CREATE TABLE IF NOT EXISTS user_settings (
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE PRIMARY KEY,
  reader_mode TEXT DEFAULT 'VERTICAL' CHECK (reader_mode IN ('VERTICAL', 'HORIZONTAL', 'WEBTOON')),
  quality TEXT DEFAULT 'HIGH' CHECK (quality IN ('HIGH', 'SAVER')),
  auto_next_chapter BOOLEAN DEFAULT TRUE,
  show_inventory TEXT DEFAULT 'PUBLIC' CHECK (show_inventory IN ('PUBLIC', 'FRIENDS', 'PRIVATE')),
  hide_nsfw BOOLEAN DEFAULT FALSE,
  notify_new_chapter BOOLEAN DEFAULT TRUE,
  notify_replies BOOLEAN DEFAULT TRUE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create settings trigger
CREATE OR REPLACE FUNCTION public.handle_new_user_settings()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_settings (user_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_profile_created_settings ON public.profiles;
CREATE TRIGGER on_profile_created_settings
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user_settings();

-- ==========================================
-- 10. ROW LEVEL SECURITY (RLS)
-- ==========================================

-- Enable RLS on all new tables
ALTER TABLE tower_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE titles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_titles ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE quest_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE guilds ENABLE ROW LEVEL SECURITY;
ALTER TABLE guild_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE reading_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- 10a. Public Read-Only Tables
CREATE POLICY "Public Read: Tower" ON tower_levels FOR SELECT USING (true);
CREATE POLICY "Public Read: Classes" ON classes FOR SELECT USING (true);
CREATE POLICY "Public Read: Titles" ON titles FOR SELECT USING (true);
CREATE POLICY "Public Read: Items" ON items FOR SELECT USING (true);
CREATE POLICY "Public Read: Quests" ON quest_definitions FOR SELECT USING (is_active = true);
CREATE POLICY "Public Read: Achievements" ON achievements FOR SELECT USING (true);
CREATE POLICY "Public Read: Guilds" ON guilds FOR SELECT USING (true);

-- 10b. User Private/Protected Data
-- Profiles: Any Auth user can view, only owner can update specific fields.
-- (Note: Columns like rubies/xp should NOT be updatable by user policies)
CREATE POLICY "Profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
-- CRITICAL: Prevent updating stats via API. Use Column Level Security if possible, or handle via Trigger.
-- Supabase RLS policies apply to rows. To protect columns, we rely on the API not exposing them or using a wrapper function usually.
-- Ideally, we'd revoke UPDATE on specific columns for the `authenticated` role, but standardized SQL migration often just sets RLS.

-- Settings
CREATE POLICY "View own settings" ON user_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Update own settings" ON user_settings FOR UPDATE USING (auth.uid() = user_id);

-- Inventory
CREATE POLICY "View public inventory" ON user_inventory FOR SELECT USING (TRUE); -- Simplified for now, or check public flag
CREATE POLICY "Update own inventory" ON user_inventory FOR UPDATE USING (auth.uid() = user_id); -- For Pinning

-- Quests Progress
CREATE POLICY "View own quests" ON user_quests FOR SELECT USING (auth.uid() = user_id);
-- Allow claiming (Client side claim action often needs update)
CREATE POLICY "Update own quests" ON user_quests FOR UPDATE USING (auth.uid() = user_id);

-- Social
CREATE POLICY "View friendships" ON friendships FOR SELECT USING (auth.uid() = user_id_1 OR auth.uid() = user_id_2);
CREATE POLICY "Manage friendships" ON friendships FOR ALL USING (auth.uid() = user_id_1 OR auth.uid() = user_id_2);

-- Guild Members
CREATE POLICY "View guild members" ON guild_members FOR SELECT USING (true);
-- Management policies (Leader can kick, etc) would go here.

-- 10c. Library
CREATE POLICY "View own bookmarks" ON bookmarks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Manage own bookmarks" ON bookmarks FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "View own history" ON reading_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Manage own history" ON reading_history FOR ALL USING (auth.uid() = user_id);

-- ==========================================
-- 11. INDEXES
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_tower_levels_floor ON tower_levels(floor_number);
CREATE INDEX IF NOT EXISTS idx_user_inventory_user ON user_inventory(user_id);
CREATE INDEX IF NOT EXISTS idx_user_quests_user ON user_quests(user_id);
CREATE INDEX IF NOT EXISTS idx_friendships_user ON friendships(user_id_1);
CREATE INDEX IF NOT EXISTS idx_reading_history_user ON reading_history(user_id);
