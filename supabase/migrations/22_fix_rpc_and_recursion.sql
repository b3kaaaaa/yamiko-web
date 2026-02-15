-- Migration: 22_fix_rpc_and_recursion.sql
-- Description: Fix PGRST203 (RPC Ambiguity) and Infinite Recursion (RLS Cycle)

-- 1. FIX RPC AMBIGUITY
-- We must drop the EXACT signature that is causing the conflict.
-- The error "Could not choose the best candidate function" happens because postgres sees:
-- get_full_guild_data(uuid) AND get_full_guild_data(text) when called with unknown type or text that looks like uuid.
-- BUT previous migrations might have created get_full_guild_data(uuid, uuid) which is even more specific.

-- Let's clean up ALL potential variations to be safe.
DROP FUNCTION IF EXISTS get_full_guild_data(UUID);
DROP FUNCTION IF EXISTS get_full_guild_data(TEXT);
DROP FUNCTION IF EXISTS get_full_guild_data(UUID, UUID); -- The likely culprit from 14_guild_api_functions.sql
DROP FUNCTION IF EXISTS get_full_guild_data(TEXT, UUID); -- The one we want to ensure is clean

-- 2. RE-CREATE THE UNIFIED FUNCTION
-- Accepts TEXT (which can be a UUID string or a Tag string) and UUID (user_id)
CREATE OR REPLACE FUNCTION get_full_guild_data(
    p_guild_id TEXT,
    p_user_id UUID DEFAULT auth.uid()
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
    v_user_role TEXT;
    v_current_user_id UUID;
BEGIN
    v_current_user_id := COALESCE(p_user_id, auth.uid());

    -- A. Resolve ID (UUID or Tag)
    IF p_guild_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
        v_guild_uuid := p_guild_id::UUID;
    ELSE
        SELECT id INTO v_guild_uuid FROM guilds WHERE UPPER(TRIM(tag)) = UPPER(TRIM(p_guild_id));
    END IF;

    IF v_guild_uuid IS NULL THEN
        RAISE EXCEPTION 'Guild not found';
    END IF;

    -- B. Fetch Data (Consolidated Logic)
    
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
        'max_members', get_max_members(g.level),
        'theme_id', g.theme_id,
        'created_at', g.created_at
    ) INTO v_guild_data
    FROM guilds g
    WHERE g.id = v_guild_uuid;

    IF v_guild_data IS NULL THEN
         RAISE EXCEPTION 'Guild not found';
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
        'permissions', jsonb_build_object(
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

GRANT EXECUTE ON FUNCTION get_full_guild_data(TEXT, UUID) TO postgres, authenticated, service_role;


-- 3. FIX INFINITE RECURSION IN RLS
-- Problem: 
-- "Public can view guild members" on guild_members checks `guilds.is_banned`
-- "Members can view own guild" on guilds checks `guild_members` to see if user is member
-- This can create a cycle if not careful.

-- Solution: Create a SECURITY DEFINER function to check is_banned.
-- SECURITY DEFINER functions run with the privileges of the creator (usually postgres/admin),
-- effectively bypassing RLS on the tables they access inside the function.

CREATE OR REPLACE FUNCTION is_guild_safe_public(p_guild_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM guilds 
        WHERE id = p_guild_id 
        AND (is_banned = false OR is_banned IS NULL)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the policy on guild_members to use the safe function
-- This breaks the recursion because reading `guild_members` -> checks policy -> calls function -> reads `guilds` (bypassing RLS) -> Done.
-- No ping-pong back to `guild_members`.

DROP POLICY IF EXISTS "Public can view guild members" ON guild_members;
CREATE POLICY "Public can view guild members"
ON guild_members FOR SELECT
USING (
    is_guild_safe_public(guild_id)
);
