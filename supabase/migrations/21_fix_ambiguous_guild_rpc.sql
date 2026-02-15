-- Migration: 21_fix_ambiguous_guild_rpc.sql
-- Description: Fix PGRST203 "Function overloading" error by removing ambiguous function signatures
-- We will drop both UUID and TEXT versions and implement a SINGLE TEXT version that handles both cases.

-- 1. Drop EXISTING conflicting functions
DROP FUNCTION IF EXISTS get_full_guild_data(UUID);
DROP FUNCTION IF EXISTS get_full_guild_data(TEXT);

-- 2. Create the UNIFIED function (Accepts TEXT, which can be UUID or Tag)
CREATE OR REPLACE FUNCTION get_full_guild_data(
    p_guild_id TEXT, -- Can be UUID or Tag
    p_user_id UUID DEFAULT auth.uid() -- Optional context user
)
RETURNS JSONB AS $$
DECLARE
    v_guild_uuid UUID;
    v_guild_data JSONB;
    v_members_data JSONB;
    v_user_status JSONB;
    v_active_raids JSONB;
    v_active_wars JSONB;
    v_member_count INTEGER;
    v_max_members INTEGER;
    v_user_role TEXT;
    v_current_user_id UUID;
BEGIN
    -- Use provided user_id or fall back to auth.uid()
    v_current_user_id := COALESCE(p_user_id, auth.uid());

    -- A. Resolve p_guild_id (TEXT) to v_guild_uuid (UUID)
    IF p_guild_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
        -- It looks like a UUID
        v_guild_uuid := p_guild_id::UUID;
    ELSE
        -- It looks like a Tag
        SELECT id INTO v_guild_uuid FROM guilds WHERE UPPER(TRIM(tag)) = UPPER(TRIM(p_guild_id));
    END IF;

    IF v_guild_uuid IS NULL THEN
        RAISE EXCEPTION 'Guild not found';
    END IF;

    -- B. Gather Data components (Logic from 15_guild_slug_support + 15_fix_guild_data)
    
    -- 1. Guild Info & Member Count
    SELECT COUNT(*) INTO v_member_count
    FROM guild_members
    WHERE guild_id = v_guild_uuid;

    SELECT jsonb_build_object(
        'id', g.id,
        'name', g.name,
        'tag', g.tag,
        'level', g.level,
        'xp', g.xp,
        'description', g.description,
        'avatar_url', g.avatar_url,
        'banner_url', g.banner_url,
        'treasury_gold', g.treasury_gold,
        'treasury_rubies', g.treasury_rubies,
        'is_recruiting', g.is_recruiting,
        'member_count', v_member_count,
        'max_members', get_max_members(g.level), -- Helper function
        'theme_id', g.theme_id, -- From slug support
        'created_at', g.created_at
    ) INTO v_guild_data
    FROM guilds g
    WHERE g.id = v_guild_uuid;

    IF v_guild_data IS NULL THEN
         RAISE EXCEPTION 'Guild not found (ID valid but row missing)';
    END IF;

    -- 2. Active Raids
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'raid_id', gr.id,
        'boss_name', bd.name,
        'current_hp', gr.current_boss_hp,
        'max_hp', bd.hp,
        'participants', (SELECT COUNT(*) FROM raid_logs WHERE raid_id = gr.id)
    )), '[]'::jsonb) INTO v_active_raids
    FROM guild_raids gr
    LEFT JOIN boss_definitions bd ON bd.id = gr.boss_id
    WHERE gr.guild_id = v_guild_uuid AND gr.status = 'active';

    -- 3. Active Wars
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'opponent_guild_id', CASE 
            WHEN gr.guild_id_a = v_guild_uuid THEN gr.guild_id_b
            ELSE gr.guild_id_a
        END,
        'opponent_name', CASE 
            WHEN gr.guild_id_a = v_guild_uuid THEN gb.name
            ELSE ga.name
        END,
        'our_score', CASE 
            WHEN gr.guild_id_a = v_guild_uuid THEN gr.war_score_a
            ELSE gr.war_score_b
        END,
        'their_score', CASE 
            WHEN gr.guild_id_a = v_guild_uuid THEN gr.war_score_b
            ELSE gr.war_score_a
        END
    )), '[]'::jsonb) INTO v_active_wars
    FROM guild_relations gr
    LEFT JOIN guilds ga ON ga.id = gr.guild_id_a
    LEFT JOIN guilds gb ON gb.id = gr.guild_id_b
    WHERE (gr.guild_id_a = v_guild_uuid OR gr.guild_id_b = v_guild_uuid)
      AND gr.status = 'war';

    -- 4. Members (Top 5)
    SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
            'user_id', gm.user_id,
            'username', p.username,
            'avatar_url', p.avatar_url,
            'role', gm.role,
            'contribution_xp', gm.contribution_xp,
            'joined_at', gm.joined_at
        )
    ), '[]'::jsonb) INTO v_members_data
    FROM guild_members gm
    JOIN profiles p ON p.id = gm.user_id
    WHERE gm.guild_id = v_guild_uuid
    ORDER BY gm.contribution_xp DESC
    LIMIT 5;

    IF v_members_data IS NULL THEN
        v_members_data := '[]'::jsonb;
    END IF;

    -- 5. User Status
    SELECT role INTO v_user_role
    FROM guild_members
    WHERE guild_id = v_guild_uuid AND user_id = v_current_user_id;

    SELECT jsonb_build_object(
        'is_member', v_user_role IS NOT NULL,
        'role', v_user_role,
        'can_donate', v_user_role IS NOT NULL,
        'can_manage', v_user_role IN ('leader', 'officer'),
        'is_leader', v_user_role = 'leader',
        'permissions', jsonb_build_object( -- Extended permissions from slug support
            'can_invite', v_user_role IN ('leader', 'officer'),
            'can_manage', v_user_role IN ('leader', 'officer')
        )
    ) INTO v_user_status;

    -- Return composed object
    RETURN jsonb_build_object(
        'info', v_guild_data,
        'state', jsonb_build_object(
            'active_raids', v_active_raids,
            'active_wars', v_active_wars
        ),
        'members', jsonb_build_object(
            'total_count', v_member_count,
            'max_count', get_max_members((v_guild_data->>'level')::INTEGER),
            'top_5', v_members_data
        ),
        'user_status', v_user_status
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions explicitly
GRANT EXECUTE ON FUNCTION get_full_guild_data(TEXT, UUID) TO postgres, authenticated, service_role;
