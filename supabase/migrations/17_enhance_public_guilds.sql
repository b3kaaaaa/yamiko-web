-- Migration: 17_enhance_public_guilds.sql
-- Description: Update get_public_guilds to include banner_url in output

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
        g.banner_url, -- Added
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

-- Re-grant permissions
GRANT EXECUTE ON FUNCTION get_public_guilds(JSONB, TEXT, INTEGER, INTEGER) TO postgres, anon, authenticated, service_role;
