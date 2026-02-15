-- Migration: 31_community_hub.sql
-- Description: Community Hub Schema, Functions, and Triggers
-- Author: Yamiko Backend Architect

-- ==========================================
-- 1. TABLES & TYPES
-- ==========================================

-- Post Types
-- Post Types
DO $$ BEGIN
    CREATE TYPE community_post_type AS ENUM ('discussion', 'theory', 'art', 'poll');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE community_interaction_type AS ENUM ('like', 'save', 'report');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Community Posts
CREATE TABLE IF NOT EXISTS community_posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    content TEXT,
    images TEXT[] DEFAULT '{}',
    type community_post_type DEFAULT 'discussion',
    tags TEXT[] DEFAULT '{}',
    metrics JSONB DEFAULT '{"likes": 0, "comments": 0, "shares": 0}'::jsonb,
    is_pinned BOOLEAN DEFAULT FALSE,
    is_spoiler BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_community_posts_user_id ON community_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_created_at ON community_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_posts_type ON community_posts(type);

-- Interactions (Likes, etc)
CREATE TABLE IF NOT EXISTS community_interactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    post_id UUID REFERENCES community_posts(id) ON DELETE CASCADE NOT NULL,
    type community_interaction_type NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, post_id, type)
);

CREATE INDEX IF NOT EXISTS idx_interactions_post_id ON community_interactions(post_id);

-- Spotlight Features (Banner)
CREATE TABLE IF NOT EXISTS spotlight_features (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    reason_text TEXT NOT NULL,
    stat_1 TEXT, -- e.g. "45 edits"
    stat_2 TEXT, -- e.g. "120 posts"
    active_until TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 2. HELPER FUNCTIONS
-- ==========================================

-- Helper to add XP (Simple version)
CREATE OR REPLACE FUNCTION add_xp_to_user(p_user_id UUID, p_amount INTEGER)
RETURNS VOID AS $$
BEGIN
    UPDATE profiles
    SET xp = xp + p_amount
    WHERE id = p_user_id;
    -- TODO: Add level up logic here later (checking tower_levels)
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- 3. TRIGGERS & LOGIC
-- ==========================================

-- Trigger: Grant XP on Post Creation
CREATE OR REPLACE FUNCTION trigger_xp_on_post()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM add_xp_to_user(NEW.user_id, 10);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_community_post_created ON community_posts;
CREATE TRIGGER on_community_post_created
AFTER INSERT ON community_posts
FOR EACH ROW
EXECUTE FUNCTION trigger_xp_on_post();

-- Trigger: Update Metrics & Check for 100 Likes XP
CREATE OR REPLACE FUNCTION trigger_update_post_metrics()
RETURNS TRIGGER AS $$
DECLARE
    v_post_id UUID;
    v_likes_count INT;
BEGIN
    IF (TG_OP = 'INSERT') THEN
        v_post_id := NEW.post_id;
    ELSE
        v_post_id := OLD.post_id;
    END IF;

    -- Only care about LIKES for now
    IF (TG_OP = 'INSERT' AND NEW.type = 'like') OR (TG_OP = 'DELETE' AND OLD.type = 'like') THEN
        SELECT COUNT(*) INTO v_likes_count 
        FROM community_interactions 
        WHERE post_id = v_post_id AND type = 'like';

        UPDATE community_posts
        SET metrics = jsonb_set(metrics, '{likes}', to_jsonb(v_likes_count))
        WHERE id = v_post_id;

        -- RPG Trigger: 100 Likes
        IF v_likes_count = 100 AND TG_OP = 'INSERT' THEN
            -- Get post owner
            PERFORM add_xp_to_user((SELECT user_id FROM community_posts WHERE id = v_post_id), 50); -- Bonus 50XP
        END IF;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_interaction_change ON community_interactions;
CREATE TRIGGER on_interaction_change
AFTER INSERT OR DELETE ON community_interactions
FOR EACH ROW
EXECUTE FUNCTION trigger_update_post_metrics();

-- ==========================================
-- 4. API FUNCTIONS (RPC)
-- ==========================================

-- Create Post
CREATE OR REPLACE FUNCTION create_community_post(
    p_content TEXT,
    p_images TEXT[],
    p_type community_post_type DEFAULT 'discussion',
    p_tags TEXT[] DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
    v_post_id UUID;
    v_is_spoiler BOOLEAN := FALSE;
BEGIN
    -- Check for spoiler tag
    IF 'Spoiler' = ANY(p_tags) OR '#Spoiler' = ANY(p_tags) THEN
        v_is_spoiler := TRUE;
    END IF;

    INSERT INTO community_posts (user_id, content, images, type, tags, is_pinned, is_spoiler)
    VALUES (auth.uid(), p_content, p_images, p_type, p_tags, FALSE, v_is_spoiler)
    RETURNING id INTO v_post_id;

    RETURN v_post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Toggle Like
CREATE OR REPLACE FUNCTION toggle_like(p_post_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM community_interactions 
        WHERE user_id = auth.uid() AND post_id = p_post_id AND type = 'like'
    ) INTO v_exists;

    IF v_exists THEN
        DELETE FROM community_interactions 
        WHERE user_id = auth.uid() AND post_id = p_post_id AND type = 'like';
        RETURN FALSE; -- Unlike
    ELSE
        INSERT INTO community_interactions (user_id, post_id, type)
        VALUES (auth.uid(), p_post_id, 'like');
        RETURN TRUE; -- Like
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get Feed
CREATE OR REPLACE FUNCTION get_community_feed(
    p_filter_type TEXT DEFAULT 'all', -- 'all', 'discussion', 'theory', 'art', 'poll'
    p_sort TEXT DEFAULT 'new', -- 'new', 'top'
    p_page INTEGER DEFAULT 1,
    p_limit INTEGER DEFAULT 10
)
RETURNS JSON AS $$
DECLARE
    v_offset INTEGER;
    v_total INTEGER;
    v_data JSON;
BEGIN
    v_offset := (p_page - 1) * p_limit;

    -- Count total (approximate for performance if needed, but strict here)
    SELECT COUNT(*) INTO v_total
    FROM community_posts p
    WHERE (p_filter_type = 'all' OR p.type::text = p_filter_type);

    SELECT json_agg(row_to_json(t)) INTO v_data
    FROM (
        SELECT 
            p.id,
            p.content,
            p.images,
            p.type,
            p.tags,
            p.metrics,
            p.is_pinned,
            p.is_spoiler,
            p.created_at,
            -- Author Info
            json_build_object(
                'id', u.id,
                'username', u.username,
                'avatar_url', u.avatar_url,
                'rank_tier', u.rank_tier,
                -- Equipped Title/Badge
                'badge', (
                    SELECT t.text 
                    FROM user_titles ut 
                    JOIN titles t ON ut.title_id = t.id 
                    WHERE ut.user_id = u.id AND ut.is_equipped = TRUE 
                    LIMIT 1
                )
            ) AS author,
            -- Current User Interaction
            EXISTS (
                SELECT 1 FROM community_interactions ci 
                WHERE ci.post_id = p.id AND ci.user_id = auth.uid() AND ci.type = 'like'
            ) AS is_liked
        FROM community_posts p
        JOIN profiles u ON p.user_id = u.id
        WHERE (p_filter_type = 'all' OR p.type::text = p_filter_type)
        ORDER BY 
            CASE WHEN p_sort = 'new' THEN p.created_at END DESC,
            CASE WHEN p_sort = 'top' THEN (p.metrics->>'likes')::int END DESC,
            p.id DESC
        LIMIT p_limit OFFSET v_offset
    ) t;

    RETURN json_build_object(
        'data', COALESCE(v_data, '[]'::json),
        'meta', json_build_object(
            'total', v_total,
            'page', p_page,
            'limit', p_limit
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get Sidebar Widgets
CREATE OR REPLACE FUNCTION get_sidebar_widgets()
RETURNS JSON AS $$
DECLARE
    v_trending JSON;
    v_guilds JSON;
    v_spotlight JSON;
BEGIN
    -- 1. Spotlight Feature (Active one or most recent)
    SELECT row_to_json(t) INTO v_spotlight
    FROM (
        SELECT 
            s.reason_text, s.stat_1, s.stat_2,
            json_build_object('username', p.username, 'avatar_url', p.avatar_url, 'rank_tier', p.rank_tier) as user
        FROM spotlight_features s
        JOIN profiles p ON s.user_id = p.id
        ORDER BY s.created_at DESC
        LIMIT 1
    ) t;

    -- 2. Trending Discussions (Last 48h, sorted by engagement)
    SELECT json_agg(row_to_json(t)) INTO v_trending
    FROM (
        SELECT id, content as title, metrics, created_at, tags
        FROM community_posts
        WHERE created_at > NOW() - INTERVAL '48 hours'
        ORDER BY ((metrics->>'likes')::int + (metrics->>'comments')::int) DESC
        LIMIT 5
    ) t;

    -- 3. Active Guilds (Reusing logic from get_top_guilds)
    SELECT json_agg(row_to_json(t)) INTO v_guilds
    FROM (
        SELECT 
            g.id, 
            g.name, 
            COUNT(gm.user_id) as member_count, 
            g.level, 
            SUBSTRING(g.name FROM 1 FOR 2) as initials 
        FROM guilds g
        LEFT JOIN guild_members gm ON g.id = gm.guild_id
        GROUP BY g.id
        ORDER BY g.level DESC, COUNT(gm.user_id) DESC 
        LIMIT 3
    ) t;

    RETURN json_build_object(
        'spotlight', v_spotlight,
        'trending', COALESCE(v_trending, '[]'::json),
        'guilds', COALESCE(v_guilds, '[]'::json)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
