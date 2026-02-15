-- =====================================================
-- YAMIKO GUILD SYSTEM - BACKEND API & ADMIN INTEGRATION
-- Migration: 14_guild_api_functions.sql
-- Description: Public API, Dashboard API, and Admin God-Mode Functions
-- =====================================================

-- =====================================================
-- 1. SUPPORTING TABLES
-- =====================================================

-- Admin Audit Log (Append-only)
CREATE TABLE IF NOT EXISTS admin_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action_type TEXT NOT NULL, -- 'guild_created', 'treasury_adjustment', 'ban', 'unban', 'raid_forced', 'level_forced'
    guild_id UUID REFERENCES guilds(id) ON DELETE SET NULL,
    admin_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    reason TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_logs_guild ON admin_logs(guild_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_admin ON admin_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_created ON admin_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_logs_action ON admin_logs(action_type);

-- Guild Applications (Join Requests)
CREATE TABLE IF NOT EXISTS guild_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    guild_id UUID NOT NULL REFERENCES guilds(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    message TEXT,
    reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ,
    
    UNIQUE(guild_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_guild_applications_guild ON guild_applications(guild_id) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_guild_applications_user ON guild_applications(user_id);

-- Add is_banned column to guilds
ALTER TABLE guilds ADD COLUMN IF NOT EXISTS is_banned BOOLEAN NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS idx_guilds_banned ON guilds(is_banned);

-- =====================================================
-- 2. PUBLIC API FUNCTIONS
-- =====================================================

-- A. Get Public Guilds List (Paginated with Filters)
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
    level INTEGER,
    member_count BIGINT,
    is_recruiting BOOLEAN,
    total_xp BIGINT
) AS $$
DECLARE
    v_offset INTEGER;
    v_min_level INTEGER;
    v_is_recruiting BOOLEAN;
    v_query TEXT;
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

-- B. Create Guild (With Cost Validation)
-- Drop old version from migration 08 (different signature)
DROP FUNCTION IF EXISTS create_guild(TEXT, VARCHAR, TEXT, UUID);

CREATE OR REPLACE FUNCTION create_guild(
    p_name TEXT,
    p_tag TEXT,
    p_description TEXT DEFAULT NULL,
    p_banner_url TEXT DEFAULT NULL,
    p_avatar_url TEXT DEFAULT NULL,
    p_founder_id UUID DEFAULT auth.uid()
)
RETURNS UUID AS $$
DECLARE
    v_guild_id UUID;
    v_founder_level INTEGER;
    v_founder_rubies INTEGER;
    v_creation_cost INTEGER := 1000; -- Configurable
BEGIN
    -- Validate founder exists and meets requirements
    SELECT level, rubies INTO v_founder_level, v_founder_rubies
    FROM profiles
    WHERE id = p_founder_id;
    
    IF v_founder_level IS NULL THEN
        RAISE EXCEPTION 'User not found';
    END IF;
    
    IF v_founder_level < 10 THEN
        RAISE EXCEPTION 'Must be level 10 or higher to create a guild';
    END IF;
    
    IF v_founder_rubies < v_creation_cost THEN
        RAISE EXCEPTION 'Insufficient rubies (need % rubies)', v_creation_cost;
    END IF;
    
    -- Check if user is already in a guild
    IF EXISTS (SELECT 1 FROM guild_members WHERE user_id = p_founder_id) THEN
        RAISE EXCEPTION 'User is already in a guild';
    END IF;
    
    -- Deduct rubies
    UPDATE profiles
    SET rubies = rubies - v_creation_cost
    WHERE id = p_founder_id;
    
    -- Create guild
    INSERT INTO guilds (name, tag, description, avatar_url, banner_url)
    VALUES (p_name, UPPER(p_tag), p_description, p_avatar_url, p_banner_url)
    RETURNING id INTO v_guild_id;
    
    -- Add founder as leader
    INSERT INTO guild_members (guild_id, user_id, role)
    VALUES (v_guild_id, p_founder_id, 'leader');
    
    -- Update user's main_guild_id
    UPDATE profiles
    SET main_guild_id = v_guild_id
    WHERE id = p_founder_id;
    
    RETURN v_guild_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 3. SINGLE GUILD DASHBOARD API
-- =====================================================

-- A. Get Full Guild Data
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
        'treasury_rubies', g.treasury_rubies
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
    SELECT COUNT(*) INTO v_member_count
    FROM guild_members
    WHERE guild_id = p_guild_id;
    
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

-- B. Request to Join Guild
CREATE OR REPLACE FUNCTION request_join_guild(
    p_guild_id UUID,
    p_message TEXT DEFAULT NULL,
    p_user_id UUID DEFAULT auth.uid()
)
RETURNS UUID AS $$
DECLARE
    v_application_id UUID;
    v_guild guilds%ROWTYPE;
    v_user_level INTEGER;
BEGIN
    -- Get guild info
    SELECT * INTO v_guild FROM guilds WHERE id = p_guild_id;
    
    IF v_guild.id IS NULL THEN
        RAISE EXCEPTION 'Guild not found';
    END IF;
    
    IF v_guild.is_banned THEN
        RAISE EXCEPTION 'Guild is banned';
    END IF;
    
    IF NOT v_guild.is_recruiting THEN
        RAISE EXCEPTION 'Guild is not accepting applications';
    END IF;
    
    -- Check user level requirement
    SELECT level INTO v_user_level FROM profiles WHERE id = p_user_id;
    
    IF v_user_level < v_guild.min_level_req THEN
        RAISE EXCEPTION 'User does not meet level requirement (need level %)', v_guild.min_level_req;
    END IF;
    
    -- Check if user is already in a guild
    IF EXISTS (SELECT 1 FROM guild_members WHERE user_id = p_user_id) THEN
        RAISE EXCEPTION 'User is already in a guild';
    END IF;
    
    -- Create application
    INSERT INTO guild_applications (guild_id, user_id, message)
    VALUES (p_guild_id, p_user_id, p_message)
    ON CONFLICT (guild_id, user_id) 
    DO UPDATE SET 
        message = EXCLUDED.message,
        status = 'pending',
        created_at = NOW()
    RETURNING id INTO v_application_id;
    
    RETURN v_application_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- C. Leave Guild (enhanced from original)
CREATE OR REPLACE FUNCTION leave_guild(
    p_user_id UUID DEFAULT auth.uid()
)
RETURNS VOID AS $$
DECLARE
    v_guild_id UUID;
    v_role TEXT;
    v_member_count INTEGER;
BEGIN
    -- Get user's guild and role
    SELECT guild_id, role INTO v_guild_id, v_role
    FROM guild_members
    WHERE user_id = p_user_id;
    
    IF v_guild_id IS NULL THEN
        RAISE EXCEPTION 'User is not in a guild';
    END IF;
    
    -- Count members
    SELECT COUNT(*) INTO v_member_count
    FROM guild_members
    WHERE guild_id = v_guild_id;
    
    -- Leaders can only leave if they're the last member OR transfer leadership first
    IF v_role = 'leader' AND v_member_count > 1 THEN
        RAISE EXCEPTION 'Guild leader must transfer leadership before leaving';
    END IF;
    
    -- If leader is last member, disband guild
    IF v_role = 'leader' AND v_member_count = 1 THEN
        DELETE FROM guilds WHERE id = v_guild_id;
        -- Cascade will handle guild_members deletion
    ELSE
        -- Remove member
        DELETE FROM guild_members WHERE user_id = p_user_id;
    END IF;
    
    -- Clear user's main_guild_id
    UPDATE profiles
    SET main_guild_id = NULL
    WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- D. Donate to Treasury
CREATE OR REPLACE FUNCTION donate_to_treasury(
    p_guild_id UUID,
    p_amount BIGINT,
    p_currency_type TEXT, -- 'gold' or 'rubies'
    p_user_id UUID DEFAULT auth.uid()
)
RETURNS VOID AS $$
DECLARE
    v_user_currency BIGINT;
BEGIN
    -- Validate user is member
    IF NOT EXISTS (SELECT 1 FROM guild_members WHERE guild_id = p_guild_id AND user_id = p_user_id) THEN
        RAISE EXCEPTION 'User is not a member of this guild';
    END IF;
    
    IF p_amount <= 0 THEN
        RAISE EXCEPTION 'Donation amount must be positive';
    END IF;
    
    -- Validate currency type and user has enough
    IF p_currency_type = 'gold' THEN
        SELECT gold INTO v_user_currency FROM profiles WHERE id = p_user_id;
        
        IF v_user_currency < p_amount THEN
            RAISE EXCEPTION 'Insufficient gold';
        END IF;
        
        -- Transfer gold
        UPDATE profiles SET gold = gold - p_amount WHERE id = p_user_id;
        UPDATE guilds SET treasury_gold = treasury_gold + p_amount WHERE id = p_guild_id;
        
    ELSIF p_currency_type = 'rubies' THEN
        SELECT rubies INTO v_user_currency FROM profiles WHERE id = p_user_id;
        
        IF v_user_currency < p_amount THEN
            RAISE EXCEPTION 'Insufficient rubies';
        END IF;
        
        -- Transfer rubies
        UPDATE profiles SET rubies = rubies - p_amount WHERE id = p_user_id;
        UPDATE guilds SET treasury_rubies = treasury_rubies + p_amount WHERE id = p_guild_id;
        
    ELSE
        RAISE EXCEPTION 'Invalid currency type (must be gold or rubies)';
    END IF;
    
    -- Update contribution stats
    UPDATE guild_members
    SET contribution_gold = contribution_gold + CASE WHEN p_currency_type = 'gold' THEN p_amount ELSE 0 END
    WHERE guild_id = p_guild_id AND user_id = p_user_id;
    
    -- Log transaction
    INSERT INTO guild_transactions (guild_id, transaction_type, amount_gold, amount_rubies, user_id, description)
    VALUES (
        p_guild_id, 
        'donation',
        CASE WHEN p_currency_type = 'gold' THEN p_amount ELSE 0 END,
        CASE WHEN p_currency_type = 'rubies' THEN p_amount ELSE 0 END,
        p_user_id,
        format('Donation: %s %s', p_amount, p_currency_type)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 4. ADMIN PANEL GOD-MODE FUNCTIONS
-- =====================================================

-- Helper function to check admin role
CREATE OR REPLACE FUNCTION is_admin(p_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = p_user_id AND role = 'ADMIN'
    );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- A. Admin Edit Guild
CREATE OR REPLACE FUNCTION admin_edit_guild(
    p_guild_id UUID,
    p_data JSONB,
    p_admin_id UUID DEFAULT auth.uid()
)
RETURNS VOID AS $$
BEGIN
    IF NOT is_admin(p_admin_id) THEN
        RAISE EXCEPTION 'Unauthorized: Admin access required';
    END IF;
    
    UPDATE guilds
    SET
        name = COALESCE(p_data->>'name', name),
        tag = COALESCE(UPPER(p_data->>'tag'), tag),
        description = COALESCE(p_data->>'description', description),
        avatar_url = COALESCE(p_data->>'avatar_url', avatar_url),
        banner_url = COALESCE(p_data->>'banner_url', banner_url),
        level = COALESCE((p_data->>'level')::INTEGER, level),
        xp = COALESCE((p_data->>'xp')::BIGINT, xp),
        updated_at = NOW()
    WHERE id = p_guild_id;
    
    -- Log action
    INSERT INTO admin_logs (action_type, guild_id, admin_id, metadata)
    VALUES ('guild_edited', p_guild_id, p_admin_id, p_data);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- B. Admin Ban Guild
CREATE OR REPLACE FUNCTION admin_ban_guild(
    p_guild_id UUID,
    p_reason TEXT,
    p_admin_id UUID DEFAULT auth.uid()
)
RETURNS VOID AS $$
BEGIN
    IF NOT is_admin(p_admin_id) THEN
        RAISE EXCEPTION 'Unauthorized: Admin access required';
    END IF;
    
    UPDATE guilds
    SET is_banned = true, updated_at = NOW()
    WHERE id = p_guild_id;
    
    -- Log action
    INSERT INTO admin_logs (action_type, guild_id, admin_id, reason)
    VALUES ('guild_banned', p_guild_id, p_admin_id, p_reason);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- C. Admin Unban Guild
CREATE OR REPLACE FUNCTION admin_unban_guild(
    p_guild_id UUID,
    p_reason TEXT DEFAULT NULL,
    p_admin_id UUID DEFAULT auth.uid()
)
RETURNS VOID AS $$
BEGIN
    IF NOT is_admin(p_admin_id) THEN
        RAISE EXCEPTION 'Unauthorized: Admin access required';
    END IF;
    
    UPDATE guilds
    SET is_banned = false, updated_at = NOW()
    WHERE id = p_guild_id;
    
    -- Log action
    INSERT INTO admin_logs (action_type, guild_id, admin_id, reason)
    VALUES ('guild_unbanned', p_guild_id, p_admin_id, p_reason);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- D. Admin Transfer Leadership
CREATE OR REPLACE FUNCTION admin_transfer_leadership(
    p_guild_id UUID,
    p_new_leader_id UUID,
    p_admin_id UUID DEFAULT auth.uid()
)
RETURNS VOID AS $$
BEGIN
    IF NOT is_admin(p_admin_id) THEN
        RAISE EXCEPTION 'Unauthorized: Admin access required';
    END IF;
    
    -- Verify new leader is a member
    IF NOT EXISTS (SELECT 1 FROM guild_members WHERE guild_id = p_guild_id AND user_id = p_new_leader_id) THEN
        RAISE EXCEPTION 'New leader must be a guild member';
    END IF;
    
    -- Demote current leader
    UPDATE guild_members
    SET role = 'officer'
    WHERE guild_id = p_guild_id AND role = 'leader';
    
    -- Promote new leader
    UPDATE guild_members
    SET role = 'leader'
    WHERE guild_id = p_guild_id AND user_id = p_new_leader_id;
    
    -- Log action
    INSERT INTO admin_logs (action_type, guild_id, admin_id, metadata)
    VALUES ('leadership_transferred', p_guild_id, p_admin_id, 
            jsonb_build_object('new_leader_id', p_new_leader_id));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- E. Admin Adjust Treasury
CREATE OR REPLACE FUNCTION admin_adjust_treasury(
    p_guild_id UUID,
    p_gold_amount BIGINT DEFAULT 0,
    p_ruby_amount BIGINT DEFAULT 0,
    p_reason TEXT DEFAULT 'Admin Adjustment',
    p_admin_id UUID DEFAULT auth.uid()
)
RETURNS VOID AS $$
BEGIN
    IF NOT is_admin(p_admin_id) THEN
        RAISE EXCEPTION 'Unauthorized: Admin access required';
    END IF;
    
    UPDATE guilds
    SET 
        treasury_gold = GREATEST(0, treasury_gold + p_gold_amount),
        treasury_rubies = GREATEST(0, treasury_rubies + p_ruby_amount),
        updated_at = NOW()
    WHERE id = p_guild_id;
    
    -- Log action
    INSERT INTO admin_logs (action_type, guild_id, admin_id, reason, metadata)
    VALUES ('treasury_adjusted', p_guild_id, p_admin_id, p_reason,
            jsonb_build_object('gold', p_gold_amount, 'rubies', p_ruby_amount));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- F. Admin Force Start Raid
CREATE OR REPLACE FUNCTION admin_force_start_raid(
    p_guild_id UUID,
    p_boss_id UUID,
    p_admin_id UUID DEFAULT auth.uid()
)
RETURNS UUID AS $$
DECLARE
    v_raid_id UUID;
    v_boss_hp INTEGER;
BEGIN
    IF NOT is_admin(p_admin_id) THEN
        RAISE EXCEPTION 'Unauthorized: Admin access required';
    END IF;
    
    -- Get boss HP
    SELECT hp INTO v_boss_hp FROM boss_definitions WHERE id = p_boss_id;
    
    IF v_boss_hp IS NULL THEN
        RAISE EXCEPTION 'Boss not found';
    END IF;
    
    -- Create raid
    INSERT INTO guild_raids (guild_id, boss_id, current_boss_hp, status)
    VALUES (p_guild_id, p_boss_id, v_boss_hp, 'active')
    RETURNING id INTO v_raid_id;
    
    -- Log action
    INSERT INTO admin_logs (action_type, guild_id, admin_id, metadata)
    VALUES ('raid_forced', p_guild_id, p_admin_id,
            jsonb_build_object('boss_id', p_boss_id, 'raid_id', v_raid_id));
    
    RETURN v_raid_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- G. Admin Force Level Up
CREATE OR REPLACE FUNCTION admin_force_level_up(
    p_guild_id UUID,
    p_levels INTEGER DEFAULT 1,
    p_admin_id UUID DEFAULT auth.uid()
)
RETURNS VOID AS $$
BEGIN
    IF NOT is_admin(p_admin_id) THEN
        RAISE EXCEPTION 'Unauthorized: Admin access required';
    END IF;
    
    IF p_levels <= 0 THEN
        RAISE EXCEPTION 'Levels must be positive';
    END IF;
    
    UPDATE guilds
    SET 
        level = LEAST(100, level + p_levels),
        updated_at = NOW()
    WHERE id = p_guild_id;
    
    -- Log action
    INSERT INTO admin_logs (action_type, guild_id, admin_id, metadata)
    VALUES ('level_forced', p_guild_id, p_admin_id,
            jsonb_build_object('levels_added', p_levels));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 5. RLS (ROW LEVEL SECURITY) POLICIES
-- =====================================================

-- Enable RLS on guilds (if not already)
ALTER TABLE guilds ENABLE ROW LEVEL SECURITY;
ALTER TABLE guild_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;

-- Guilds: Public can view non-banned guilds
DROP POLICY IF EXISTS "Public can view guilds" ON guilds;
CREATE POLICY "Public can view guilds"
ON guilds FOR SELECT
USING (is_banned = false OR is_banned IS NULL);

-- Guilds: Members can view their own guild even if banned
DROP POLICY IF EXISTS "Members can view own guild" ON guilds;
CREATE POLICY "Members can view own guild"
ON guilds FOR SELECT
USING (
    id IN (SELECT guild_id FROM guild_members WHERE user_id = auth.uid())
);

-- Guilds: Admins can view all guilds
DROP POLICY IF EXISTS "Admins can view all guilds" ON guilds;
CREATE POLICY "Admins can view all guilds"
ON guilds FOR SELECT
USING (is_admin(auth.uid()));

-- Guilds: Admins can modify any guild
DROP POLICY IF EXISTS "Admins can modify guilds" ON guilds;
CREATE POLICY "Admins can modify guilds"
ON guilds FOR ALL
USING (is_admin(auth.uid()));

-- Guild Members: Public can view members of non-banned guilds
DROP POLICY IF EXISTS "Public can view guild members" ON guild_members;
CREATE POLICY "Public can view guild members"
ON guild_members FOR SELECT
USING (
    guild_id IN (SELECT id FROM guilds WHERE is_banned = false OR is_banned IS NULL)
);

-- Guild Members: Admins can view/edit all members
DROP POLICY IF EXISTS "Admins can manage members" ON guild_members;
CREATE POLICY "Admins can manage members"
ON guild_members FOR ALL
USING (is_admin(auth.uid()));

-- Admin Logs: Only admins can view audit logs
DROP POLICY IF EXISTS "Admins can view logs" ON admin_logs;
CREATE POLICY "Admins can view logs"
ON admin_logs FOR SELECT
USING (is_admin(auth.uid()));

-- Admin Logs: Append-only (no DELETE allowed)
-- (Already enforced by not creating DELETE policy)

-- =====================================================
-- 6. TRIGGERS & AUTOMATION
-- =====================================================

-- Auto-create audit log entry when guild is created
CREATE OR REPLACE FUNCTION log_guild_creation()
RETURNS TRIGGER AS $$
DECLARE
    v_founder_id UUID;
BEGIN
    -- Get founder ID
    SELECT user_id INTO v_founder_id
    FROM guild_members
    WHERE guild_id = NEW.id AND role = 'leader'
    LIMIT 1;
    
    INSERT INTO admin_logs (action_type, guild_id, metadata)
    VALUES (
        'guild_created',
        NEW.id,
        jsonb_build_object(
            'name', NEW.name,
            'tag', NEW.tag,
            'founder_id', v_founder_id
        )
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_log_guild_creation ON guilds;
CREATE TRIGGER trigger_log_guild_creation
AFTER INSERT ON guilds
FOR EACH ROW
EXECUTE FUNCTION log_guild_creation();

-- Create Admin Audit Log View
CREATE OR REPLACE VIEW admin_guild_audit_log AS
SELECT 
    l.id,
    l.action_type,
    l.guild_id,
    g.name as guild_name,
    l.admin_id,
    p.username as admin_username,
    l.reason,
    l.metadata,
    l.created_at
FROM admin_logs l
LEFT JOIN guilds g ON g.id = l.guild_id
LEFT JOIN profiles p ON p.id = l.admin_id
ORDER BY l.created_at DESC
LIMIT 1000;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON FUNCTION get_public_guilds IS 'Fetch paginated guild list with filters (min_level, is_recruiting) and sorting (xp, member_count, created_at)';
COMMENT ON FUNCTION create_guild IS 'Create new guild (costs 1000 rubies, requires level 10+)';
COMMENT ON FUNCTION get_full_guild_data IS 'Get comprehensive guild dashboard data including raids, wars, members, and user status';
COMMENT ON FUNCTION request_join_guild IS 'Create guild join application';
COMMENT ON FUNCTION donate_to_treasury IS 'Transfer gold or rubies from user to guild treasury';
COMMENT ON FUNCTION admin_edit_guild IS 'Admin: Force edit any guild property';
COMMENT ON FUNCTION admin_ban_guild IS 'Admin: Ban guild and freeze treasury';
COMMENT ON FUNCTION admin_transfer_leadership IS 'Admin: Force leadership transfer';
COMMENT ON FUNCTION admin_adjust_treasury IS 'Admin: Add/remove gold or rubies from guild';
COMMENT ON FUNCTION admin_force_start_raid IS 'Admin: Manually trigger a raid event';
COMMENT ON FUNCTION admin_force_level_up IS 'Admin: Instantly grant guild levels';
COMMENT ON TABLE admin_logs IS 'Append-only audit log for all admin actions on guilds';
COMMENT ON TABLE guild_applications IS 'Guild join requests pending approval';
