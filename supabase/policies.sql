-- YAMIKO Row Level Security Policies
-- Run this AFTER schema.sql and functions.sql

-- ============================================================
-- ENABLE RLS ON ALL TABLES
-- ============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE manga ENABLE ROW LEVEL SECURITY;
ALTER TABLE chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE genres ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE manga_genres ENABLE ROW LEVEL SECURITY;
ALTER TABLE manga_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE card_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE card_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE guilds ENABLE ROW LEVEL SECURITY;
ALTER TABLE guild_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE library_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE reading_history ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- PROFILES POLICIES
-- ============================================================

-- Anyone can view profiles
CREATE POLICY "Profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ============================================================
-- MANGA & CHAPTERS POLICIES
-- ============================================================

-- Anyone can view manga
CREATE POLICY "Manga is viewable by everyone"
  ON manga FOR SELECT
  USING (true);

-- Only admins can create/update/delete manga
CREATE POLICY "Only admins can modify manga"
  ON manga FOR ALL
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'ADMIN');

-- Anyone can view chapters
CREATE POLICY "Chapters are viewable by everyone"
  ON chapters FOR SELECT
  USING (true);

-- Only admins can create/update/delete chapters
CREATE POLICY "Only admins can modify chapters"
  ON chapters FOR ALL
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'ADMIN');

-- ============================================================
-- GENRES & TAGS POLICIES
-- ============================================================

CREATE POLICY "Genres are viewable by everyone"
  ON genres FOR SELECT
  USING (true);

CREATE POLICY "Tags are viewable by everyone"
  ON tags FOR SELECT
  USING (true);

CREATE POLICY "Manga genres are viewable by everyone"
  ON manga_genres FOR SELECT
  USING (true);

CREATE POLICY "Manga tags are viewable by everyone"
  ON manga_tags FOR SELECT
  USING (true);

-- ============================================================
-- CARDS POLICIES
-- ============================================================

CREATE POLICY "Card collections are viewable by everyone"
  ON card_collections FOR SELECT
  USING (true);

CREATE POLICY "Card templates are viewable by everyone"
  ON card_templates FOR SELECT
  USING (true);

-- Users can view their own cards
CREATE POLICY "Users can view own cards"
  ON user_cards FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own cards (from gacha)
CREATE POLICY "Users can insert own cards"
  ON user_cards FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- GUILDS POLICIES
-- ============================================================

CREATE POLICY "Guilds are viewable by everyone"
  ON guilds FOR SELECT
  USING (true);

CREATE POLICY "Guild members are viewable by everyone"
  ON guild_members FOR SELECT
  USING (true);

-- Guild leaders can update their guild
CREATE POLICY "Guild leaders can update guild"
  ON guilds FOR UPDATE
  USING (auth.uid() = leader_id);

-- ============================================================
-- FORUMS POLICIES
-- ============================================================

CREATE POLICY "Forum threads are viewable by everyone"
  ON forum_threads FOR SELECT
  USING (true);

CREATE POLICY "Users can create threads"
  ON forum_threads FOR INSERT
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update own threads"
  ON forum_threads FOR UPDATE
  USING (auth.uid() = author_id);

CREATE POLICY "Comments are viewable by everyone"
  ON comments FOR SELECT
  USING (true);

CREATE POLICY "Users can create comments"
  ON comments FOR INSERT
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update own comments"
  ON comments FOR UPDATE
  USING (auth.uid() = author_id);

-- ============================================================
-- TRANSACTIONS POLICIES
-- ============================================================

-- Users can only view their own transactions
CREATE POLICY "Users can view own transactions"
  ON transactions FOR SELECT
  USING (auth.uid() = user_id);

-- Only service_role can insert transactions
-- (handled by functions)

-- ============================================================
-- ACHIEVEMENTS POLICIES
-- ============================================================

CREATE POLICY "Achievements are viewable by everyone"
  ON achievements FOR SELECT
  USING (true);

CREATE POLICY "Users can view own achievements"
  ON user_achievements FOR SELECT
  USING (auth.uid() = user_id);

-- ============================================================
-- LIBRARY & READING HISTORY POLICIES
-- ============================================================

CREATE POLICY "Users can view own library"
  ON library_entries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own library"
  ON library_entries FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own reading history"
  ON reading_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own reading history"
  ON reading_history FOR ALL
  USING (auth.uid() = user_id);
