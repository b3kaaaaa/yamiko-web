-- Migration: 15_fix_guild_data.sql
-- Description: Fix get_full_guild_data return fields and add get_manga_territory

-- 1. Fix get_full_guild_data to include is_recruiting and member_count in 'info'
CREATE OR REPLACE FUNCTION get_full_guild_data(
    p_guild_id UUID,
    p_user_id UUID DEFAULT auth.uid()
)
RETURNS JSONB AS $$
DECLARE
    v_result JSONB;
    v_guild_info JSONB;
    v_active_raids JSONB;
    v_active_wars JSONB;
    v_members JSONB;
    v_user_status JSONB;
    v_member_count INTEGER;
    v_max_members INTEGER;
    v_user_role TEXT;
BEGIN
    -- Count members first
    SELECT COUNT(*) INTO v_member_count
    FROM guild_members
    WHERE guild_id = p_guild_id;

    -- 1. Guild Info
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
        'member_count', v_member_count
    ) INTO v_guild_info
    FROM guilds g
    WHERE g.id = p_guild_id;
    
    IF v_guild_info IS NULL THEN
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
    WHERE gr.guild_id = p_guild_id AND gr.status = 'active';
    
    -- 3. Active Wars
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'opponent_guild_id', CASE 
            WHEN gr.guild_id_a = p_guild_id THEN gr.guild_id_b
            ELSE gr.guild_id_a
        END,
        'opponent_name', CASE 
            WHEN gr.guild_id_a = p_guild_id THEN gb.name
            ELSE ga.name
        END,
        'our_score', CASE 
            WHEN gr.guild_id_a = p_guild_id THEN gr.war_score_a
            ELSE gr.war_score_b
        END,
        'their_score', CASE 
            WHEN gr.guild_id_a = p_guild_id THEN gr.war_score_b
            ELSE gr.war_score_a
        END
    )), '[]'::jsonb) INTO v_active_wars
    FROM guild_relations gr
    LEFT JOIN guilds ga ON ga.id = gr.guild_id_a
    LEFT JOIN guilds gb ON gb.id = gr.guild_id_b
    WHERE (gr.guild_id_a = p_guild_id OR gr.guild_id_b = p_guild_id)
      AND gr.status = 'war';
    
    -- 4. Members (Total count + Top 5)
    v_max_members := get_max_members((v_guild_info->>'level')::INTEGER);
    
    SELECT jsonb_build_object(
        'total_count', v_member_count,
        'max_count', v_max_members,
        'top_5', COALESCE((
            SELECT jsonb_agg(member_data)
            FROM (
                SELECT jsonb_build_object(
                    'user_id', p.id,
                    'username', p.username,
                    'avatar_url', p.avatar_url,
                    'role', gm.role,
                    'contribution_xp', gm.contribution_xp
                ) as member_data
                FROM guild_members gm
                JOIN profiles p ON p.id = gm.user_id
                WHERE gm.guild_id = p_guild_id
                ORDER BY gm.contribution_xp DESC
                LIMIT 5
            ) top_members
        ), '[]'::jsonb)
    ) INTO v_members;
    
    -- 5. User Status
    SELECT role INTO v_user_role
    FROM guild_members
    WHERE guild_id = p_guild_id AND user_id = p_user_id;
    
    SELECT jsonb_build_object(
        'is_member', v_user_role IS NOT NULL,
        'role', v_user_role,
        'can_donate', v_user_role IS NOT NULL,
        'can_manage', v_user_role IN ('leader', 'officer')
    ) INTO v_user_status;
    
    -- Build final result
    v_result := jsonb_build_object(
        'info', v_guild_info,
        'state', jsonb_build_object(
            'active_raids', v_active_raids,
            'active_wars', v_active_wars
        ),
        'members', v_members,
        'user_status', v_user_status
    );
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;


-- 2. New Function: Get Manga Territory Control
CREATE OR REPLACE FUNCTION get_manga_territory(p_manga_id TEXT)
RETURNS JSONB AS $$
DECLARE
    v_data JSONB;
BEGIN
    -- Check if territory_control table exists first to avoid error if not migrated
    IF EXISTS (
           SELECT FROM information_schema.tables 
           WHERE  table_schema = 'public'
           AND    table_name   = 'territory_control'
       ) THEN
        
        SELECT jsonb_build_object(
            'guild_id', tc.guild_id,
            'guild_name', g.name,
            'guild_tag', g.tag,
            'guild_avatar', g.avatar_url,
            'guild_level', g.level,
            'controlled_since', tc.controlled_since,
            'influence', 50 -- Mock influence for now
        ) INTO v_data
        FROM territory_control tc
        JOIN guilds g ON g.id = tc.guild_id
        WHERE tc.manga_id = p_manga_id;
        
    END IF;
    
    RETURN v_data; -- Returns NULL if no Territory or Table missing
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;
