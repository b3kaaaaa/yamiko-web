-- Migration: 20_guild_consolidated_16_19.sql
-- Description: Consolidated migration for Guild System Enhancements & Admin Panel
-- Combines: 
-- 16_fix_permissions.sql
-- 17_enhance_public_guilds.sql
-- 18_admin_api.sql
-- 19_admin_actions.sql

-- ==========================================
-- 1. FIX PERMISSIONS (From 16)
-- ==========================================

-- Public List RPC
GRANT EXECUTE ON FUNCTION get_public_guilds(JSONB, TEXT, INTEGER, INTEGER) TO postgres, anon, authenticated, service_role;

-- Single Guild RPC
GRANT EXECUTE ON FUNCTION get_full_guild_data(UUID, UUID) TO postgres, anon, authenticated, service_role;

-- Manga Territory RPC
GRANT EXECUTE ON FUNCTION get_manga_territory(TEXT) TO postgres, anon, authenticated, service_role;

-- Join Request
GRANT EXECUTE ON FUNCTION request_join_guild(UUID, TEXT, UUID) TO postgres, authenticated, service_role;

-- Create Guild
GRANT EXECUTE ON FUNCTION create_guild(TEXT, TEXT, TEXT, TEXT, TEXT, UUID) TO postgres, authenticated, service_role;

-- Member Actions
GRANT EXECUTE ON FUNCTION leave_guild(UUID) TO postgres, authenticated, service_role;
GRANT EXECUTE ON FUNCTION donate_to_treasury(UUID, BIGINT, TEXT, UUID) TO postgres, authenticated, service_role;


-- ==========================================
-- 2. ENHANCE PUBLIC GUILDS (From 17)
-- ==========================================

DROP FUNCTION IF EXISTS get_public_guilds(JSONB, TEXT, INTEGER, INTEGER);

CREATE OR REPLACE FUNCTION get_public_guilds(
    p_filter JSONB DEFAULT '{}',
    p_sort_by TEXT DEFAULT 'xp',
    p_page INTEGER DEFAULT 1,
    p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
    id UUID,
    name TEXT,
    tag TEXT,
    avatar_url TEXT,
    banner_url TEXT, -- NEW FIELD
    level INTEGER,
    member_count BIGINT,
    is_recruiting BOOLEAN,
    total_xp BIGINT
) AS $$
DECLARE
    v_offset INTEGER;
    v_min_level INTEGER;
    v_is_recruiting BOOLEAN;
BEGIN
    -- Pagination
    v_offset := (p_page - 1) * p_limit;
    
    -- Extract filters
    v_min_level := (p_filter->>'min_level')::INTEGER;
    v_is_recruiting := (p_filter->>'is_recruiting')::BOOLEAN;
    
    -- Build dynamic query
    RETURN QUERY
    SELECT 
        g.id,
        g.name,
        g.tag,
        g.avatar_url,
        g.banner_url,
        g.level,
        COUNT(gm.user_id) as member_count,
        g.is_recruiting,
        g.xp as total_xp
    FROM guilds g
    LEFT JOIN guild_members gm ON gm.guild_id = g.id
    WHERE 
        (g.is_banned = false OR g.is_banned IS NULL)
        AND (v_min_level IS NULL OR g.level >= v_min_level)
        AND (v_is_recruiting IS NULL OR g.is_recruiting = v_is_recruiting)
    GROUP BY g.id
    ORDER BY
        CASE 
            WHEN p_sort_by = 'xp' THEN g.xp
            WHEN p_sort_by = 'level' THEN g.level
            ELSE g.xp
        END DESC,
        CASE 
            WHEN p_sort_by = 'member_count' THEN COUNT(gm.user_id)
            ELSE 0
        END DESC,
        CASE 
            WHEN p_sort_by = 'created_at' THEN EXTRACT(EPOCH FROM g.created_at)
            ELSE 0
        END DESC
    LIMIT p_limit
    OFFSET v_offset;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_public_guilds(JSONB, TEXT, INTEGER, INTEGER) TO postgres, anon, authenticated, service_role;


-- ==========================================
-- 3. ADMIN API (From 18)
-- ==========================================

CREATE OR REPLACE FUNCTION admin_get_guilds(
    p_filter JSONB DEFAULT '{}',
    p_sort_by TEXT DEFAULT 'created_at',
    p_page INTEGER DEFAULT 1,
    p_limit INTEGER DEFAULT 20,
    p_admin_id UUID DEFAULT auth.uid()
)
RETURNS TABLE (
    id UUID,
    name TEXT,
    tag TEXT,
    level INTEGER,
    member_count BIGINT,
    owner_id UUID,
    owner_username TEXT,
    is_recruiting BOOLEAN,
    is_banned BOOLEAN,
    status TEXT, -- 'Active', 'Banned'
    created_at TIMESTAMPTZ,
    treasury_gold BIGINT,
    treasury_rubies BIGINT
) AS $$
DECLARE
    v_offset INTEGER;
    v_search TEXT;
BEGIN
    IF NOT is_admin(p_admin_id) THEN
        RAISE EXCEPTION 'Unauthorized';
    END IF;

    v_offset := (p_page - 1) * p_limit;
    v_search := p_filter->>'search';
    
    RETURN QUERY
    SELECT 
        g.id,
        g.name,
        g.tag,
        g.level,
        COUNT(gm.user_id) as member_count,
        owner.id as owner_id,
        owner.username as owner_username,
        g.is_recruiting,
        g.is_banned,
        CASE WHEN g.is_banned THEN 'Banned' ELSE 'Active' END as status,
        g.created_at,
        g.treasury_gold,
        g.treasury_rubies
    FROM guilds g
    LEFT JOIN guild_members gm ON gm.guild_id = g.id
    LEFT JOIN guild_members owner_link ON owner_link.guild_id = g.id AND owner_link.role = 'leader'
    LEFT JOIN profiles owner ON owner.id = owner_link.user_id
    WHERE 
        (v_search IS NULL OR 
         g.name ILIKE '%' || v_search || '%' OR 
         g.tag ILIKE '%' || v_search || '%')
    GROUP BY g.id, owner.id, owner.username
    ORDER BY
        CASE WHEN p_sort_by = 'created_at' THEN g.created_at END DESC,
        CASE WHEN p_sort_by = 'level' THEN g.level END DESC,
        CASE WHEN p_sort_by = 'members' THEN COUNT(gm.user_id) END DESC
    LIMIT p_limit
    OFFSET v_offset;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION admin_get_guilds(JSONB, TEXT, INTEGER, INTEGER, UUID) TO postgres, authenticated, service_role;


-- ==========================================
-- 4. ADMIN ACTIONS (From 19)
-- ==========================================

-- Seed Boss Definitions (Idempotent)
INSERT INTO boss_definitions (name, description, tier, base_hp, hp_scaling_per_level, guaranteed_gold, guaranteed_xp, min_guild_level, avatar_url)
SELECT 'Ancient Dragon', 'A massive dragon breathing fire.', 'legendary', 1000000, 50000, 5000, 2000, 10, '/images/bosses/dragon.png'
WHERE NOT EXISTS (SELECT 1 FROM boss_definitions WHERE name = 'Ancient Dragon');

INSERT INTO boss_definitions (name, description, tier, base_hp, hp_scaling_per_level, guaranteed_gold, guaranteed_xp, min_guild_level, avatar_url)
SELECT 'Shadow Demon', 'A demon from the abyss.', 'epic', 500000, 25000, 2500, 1000, 5, '/images/bosses/demon.png'
WHERE NOT EXISTS (SELECT 1 FROM boss_definitions WHERE name = 'Shadow Demon');

INSERT INTO boss_definitions (name, description, tier, base_hp, hp_scaling_per_level, guaranteed_gold, guaranteed_xp, min_guild_level, avatar_url)
SELECT 'Goblin King', 'Leader of the goblin horde.', 'common', 50000, 2000, 500, 200, 1, '/images/bosses/goblin.png'
WHERE NOT EXISTS (SELECT 1 FROM boss_definitions WHERE name = 'Goblin King');

-- Admin Update Guild
CREATE OR REPLACE FUNCTION admin_update_guild(
    p_guild_id UUID,
    p_name TEXT,
    p_tag TEXT,
    p_level INTEGER,
    p_treasury_gold BIGINT,
    p_treasury_rubies BIGINT,
    p_is_recruiting BOOLEAN,
    p_admin_id UUID DEFAULT auth.uid()
)
RETURNS VOID AS $$
BEGIN
    IF NOT is_admin(p_admin_id) THEN
        RAISE EXCEPTION 'Unauthorized';
    END IF;

    UPDATE guilds
    SET
        name = p_name,
        tag = p_tag,
        level = p_level,
        treasury_gold = p_treasury_gold,
        treasury_rubies = p_treasury_rubies,
        is_recruiting = p_is_recruiting,
        updated_at = NOW()
    WHERE id = p_guild_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Admin Force Start Raid
CREATE OR REPLACE FUNCTION admin_force_start_raid(
    p_guild_id UUID,
    p_boss_id UUID,
    p_admin_id UUID DEFAULT auth.uid()
)
RETURNS UUID AS $$
DECLARE
    v_raid_id UUID;
    v_boss boss_definitions%ROWTYPE;
    v_guild_level INTEGER;
    v_max_hp BIGINT;
    v_duration_hours INTEGER;
BEGIN
    IF NOT is_admin(p_admin_id) THEN
        RAISE EXCEPTION 'Unauthorized';
    END IF;

    IF EXISTS (SELECT 1 FROM guild_raids WHERE guild_id = p_guild_id AND status = 'active') THEN
        RAISE EXCEPTION 'Guild already has an active raid. Cancel it first.';
    END IF;

    SELECT * INTO v_boss FROM boss_definitions WHERE id = p_boss_id;
    SELECT level INTO v_guild_level FROM guilds WHERE id = p_guild_id;

    v_max_hp := v_boss.base_hp + (v_guild_level * v_boss.hp_scaling_per_level);
     v_duration_hours := CASE v_boss.tier
        WHEN 'common' THEN 24
        WHEN 'rare' THEN 48
        WHEN 'epic' THEN 72
        WHEN 'legendary' THEN 96
        WHEN 'mythic' THEN 120
    END;

    INSERT INTO guild_raids (guild_id, boss_id, current_hp, max_hp, ends_at)
    VALUES (p_guild_id, p_boss_id, v_max_hp, v_max_hp, NOW() + (v_duration_hours || ' hours')::INTERVAL)
    RETURNING id INTO v_raid_id;

    RETURN v_raid_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get Bosses
CREATE OR REPLACE FUNCTION get_boss_definitions()
RETURNS SETOF boss_definitions AS $$
    SELECT * FROM boss_definitions ORDER BY min_guild_level ASC;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Grants
GRANT EXECUTE ON FUNCTION admin_update_guild(UUID, TEXT, TEXT, INTEGER, BIGINT, BIGINT, BOOLEAN, UUID) TO postgres, authenticated, service_role;
GRANT EXECUTE ON FUNCTION admin_force_start_raid(UUID, UUID, UUID) TO postgres, authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_boss_definitions() TO postgres, anon, authenticated, service_role;
