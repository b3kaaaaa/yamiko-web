-- =====================================================
-- ПОЛНЫЙ РЕМОНТ GUILD ФУНКЦИЙ v2
-- Фикс: VARCHAR(5) vs TEXT mismatch в колонке tag
-- Выполни ЦЕЛИКОМ в Supabase SQL Editor одним блоком
-- =====================================================

-- 1. Убиваем ВСЕ старые версии функций
DROP FUNCTION IF EXISTS get_public_guilds(JSONB, TEXT, INTEGER, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS admin_get_guilds(JSONB, TEXT, INTEGER, INTEGER, UUID) CASCADE;

-- 2. Гарантируем нужные колонки
ALTER TABLE guilds ADD COLUMN IF NOT EXISTS is_banned BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE guilds ADD COLUMN IF NOT EXISTS banner_url TEXT;

-- =====================================================
-- 3. get_public_guilds — tag::TEXT чтобы совпадало
-- =====================================================
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
    banner_url TEXT,
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
    v_offset := (p_page - 1) * p_limit;
    v_min_level := (p_filter->>'min_level')::INTEGER;
    v_is_recruiting := (p_filter->>'is_recruiting')::BOOLEAN;
    
    RETURN QUERY
    SELECT 
        g.id,
        g.name,
        g.tag::TEXT,
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
            WHEN p_sort_by = 'members' THEN COUNT(gm.user_id)
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

-- =====================================================
-- 4. admin_get_guilds — tag::TEXT чтобы совпадало
-- =====================================================
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
    status TEXT,
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
        g.tag::TEXT,
        g.level,
        COUNT(gm.user_id) as member_count,
        owner.id as owner_id,
        owner.username as owner_username,
        g.is_recruiting,
        g.is_banned,
        CASE WHEN g.is_banned THEN 'Banned'::TEXT ELSE 'Active'::TEXT END as status,
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
         g.tag::TEXT ILIKE '%' || v_search || '%')
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

-- =====================================================
-- 5. Восстанавливаем RLS политики
-- =====================================================
DROP POLICY IF EXISTS "Public can view guilds" ON guilds;
CREATE POLICY "Public can view guilds"
ON guilds FOR SELECT
USING (is_banned = false OR is_banned IS NULL);

DROP POLICY IF EXISTS "Members can view own guild" ON guilds;
CREATE POLICY "Members can view own guild"
ON guilds FOR SELECT
USING (id IN (SELECT guild_id FROM guild_members WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Admins can view all guilds" ON guilds;
CREATE POLICY "Admins can view all guilds"
ON guilds FOR SELECT
USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can modify guilds" ON guilds;
CREATE POLICY "Admins can modify guilds"
ON guilds FOR ALL
USING (is_admin(auth.uid()));

-- ГОТОВО!
DO $$ BEGIN RAISE NOTICE 'Guild функции пересозданы с правильными типами (tag::TEXT)!'; END $$;
