-- Migration to support fetching guild by ID or Tag
-- This allows using the tag (e.g. "TEST") as a URL slug instead of UUID

-- Drop the old function if it exists to avoid conflicts or just overloading it
-- Actually, we can just create a new one or replace it.
-- Drop the old function if it exists to avoid conflicts or parameter name issues
DROP FUNCTION IF EXISTS get_full_guild_data(TEXT);

CREATE OR REPLACE FUNCTION get_full_guild_data(p_guild_id TEXT)
RETURNS JSONB AS $$
DECLARE
    v_guild_id UUID;
    v_guild_data JSONB;
    v_members_data JSONB;
    v_user_status JSONB;
    v_current_user_id UUID;
BEGIN
    v_current_user_id := auth.uid();

    -- Determine if p_guild_id is a UUID or a Tag
    -- We can try to cast to UUID, if fails, assume it's a tag
    -- Or just check if it matches UUID format regex
    
    IF p_guild_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
        v_guild_id := p_guild_id::UUID;
    ELSE
        -- It's a tag (case insensitive search usually better, but tag is usually uppercase or specific case)
        -- Constraints say tag is usually uppercase? "CONSTRAINT valid_tag_format CHECK (tag ~ '^[A-Z0-9]+$')"
        -- So we should UPPER() it just in case
        SELECT id INTO v_guild_id FROM guilds WHERE UPPER(TRIM(tag)) = UPPER(TRIM(p_guild_id));
    END IF;

    IF v_guild_id IS NULL THEN
        RAISE EXCEPTION 'Guild not found';
    END IF;

    -- 1. Get Guild Info
    SELECT jsonb_build_object(
        'id', g.id,
        'name', g.name,
        'tag', g.tag,
        'description', g.description,
        'level', g.level,
        'xp', g.xp,
        'treasury_gold', g.treasury_gold,
        'treasury_rubies', g.treasury_rubies,
        'is_recruiting', g.is_recruiting,
        'min_level_req', g.min_level_req,
        'member_count', get_member_count(g.id),
        'max_members', get_max_members(g.level),
        'avatar_url', g.avatar_url,
        'banner_url', g.banner_url,
        'theme_id', g.theme_id,
        'created_at', g.created_at
    ) INTO v_guild_data
    FROM guilds g
    WHERE g.id = v_guild_id;

    -- 2. Get Top Members (Top 5 by contribution)
    SELECT jsonb_agg(
        jsonb_build_object(
            'user_id', gm.user_id,
            'username', p.username,
            'avatar_url', p.avatar_url,
            'role', gm.role,
            'contribution_xp', gm.contribution_xp,
            'joined_at', gm.joined_at
        )
    ) INTO v_members_data
    FROM guild_members gm
    JOIN profiles p ON p.id = gm.user_id
    WHERE gm.guild_id = v_guild_id
    ORDER BY gm.contribution_xp DESC
    LIMIT 5;

    -- Handle empty members case
    IF v_members_data IS NULL THEN
        v_members_data := '[]'::jsonb;
    END IF;

    -- 3. Get Current User Status
    SELECT jsonb_build_object(
        'is_member', (EXISTS (SELECT 1 FROM guild_members WHERE guild_id = v_guild_id AND user_id = v_current_user_id)),
        'role', (SELECT role FROM guild_members WHERE guild_id = v_guild_id AND user_id = v_current_user_id),
        'permissions', jsonb_build_object(
            'can_invite', has_guild_permission(v_current_user_id, v_guild_id, 'officer'),
            'can_manage', has_guild_permission(v_current_user_id, v_guild_id, 'officer'),
            'is_leader', (SELECT role FROM guild_members WHERE guild_id = v_guild_id AND user_id = v_current_user_id) = 'leader'
        )
    ) INTO v_user_status;

    -- Return composed object
    RETURN jsonb_build_object(
        'info', v_guild_data,
        'members', jsonb_build_object('top_5', v_members_data),
        'user_status', v_user_status
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_full_guild_data(TEXT) TO postgres, authenticated, service_role;
