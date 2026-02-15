-- Migration: 18_admin_api.sql
-- Description: Admin RPCs for Guild Management

-- 1. Get All Guilds (Admin View)
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

-- Grant to authenticated (internal check handles security)
GRANT EXECUTE ON FUNCTION admin_get_guilds(JSONB, TEXT, INTEGER, INTEGER, UUID) TO postgres, authenticated, service_role;
