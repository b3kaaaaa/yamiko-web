-- =====================================================
-- YAMIKO GUILD SYSTEM - PHASE 1: CORE INFRASTRUCTURE
-- Migration: 08_guild_core.sql
-- Description: Core guild tables, enums, and basic management functions
-- =====================================================

-- SAFETY FIX: Drop potentially conflicting policies from previous failed migrations
DROP POLICY IF EXISTS "Admins can update profiles" ON profiles;

DO $$ 
BEGIN
    -- Fix moderation_logs policy (check table first)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'moderation_logs') THEN
        DROP POLICY IF EXISTS "Admins can view and create logs" ON moderation_logs;
    END IF;
    
    -- Fix boss_definitions policy (check table first)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'boss_definitions') THEN
        DROP POLICY IF EXISTS "Admins can manage boss definitions" ON boss_definitions;
    END IF;
END $$;

-- SAFETY FIX: Ensure role column exists to prevent RLS errors
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'USER';
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- =====================================================
-- ENUMS
-- =====================================================

DO $$ BEGIN
    CREATE TYPE guild_role AS ENUM ('leader', 'officer', 'veteran', 'member', 'recruit');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE guild_relation_status AS ENUM ('ally', 'neutral', 'war', 'non_aggression_pact');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE guild_theme AS ENUM ('default', 'cyberpunk', 'dark_fantasy', 'royal', 'shadow');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- =====================================================
-- CORE TABLES
-- =====================================================

-- Main Guild Entity
CREATE TABLE IF NOT EXISTS guilds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    tag VARCHAR(5) NOT NULL UNIQUE,
    description TEXT,
    
    -- Progression
    level INTEGER NOT NULL DEFAULT 1 CHECK (level >= 1 AND level <= 100),
    xp BIGINT NOT NULL DEFAULT 0 CHECK (xp >= 0),
    
    -- Treasury
    treasury_gold BIGINT NOT NULL DEFAULT 0 CHECK (treasury_gold >= 0),
    treasury_rubies BIGINT NOT NULL DEFAULT 0 CHECK (treasury_rubies >= 0),
    
    -- Economy Settings
    tax_rate INTEGER NOT NULL DEFAULT 5 CHECK (tax_rate >= 0 AND tax_rate <= 30),
    
    -- Recruitment Settings
    is_recruiting BOOLEAN NOT NULL DEFAULT true,
    min_level_req INTEGER NOT NULL DEFAULT 1 CHECK (min_level_req >= 1),
    
    -- Academy System (Parent-Child Guilds)
    parent_guild_id UUID REFERENCES guilds(id) ON DELETE SET NULL,
    
    -- Customization
    avatar_url TEXT,
    banner_url TEXT,
    theme_id guild_theme NOT NULL DEFAULT 'default',
    
    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_name_length CHECK (char_length(name) >= 3 AND char_length(name) <= 30),
    CONSTRAINT valid_tag_length CHECK (char_length(tag) >= 2 AND char_length(tag) <= 5),
    CONSTRAINT valid_tag_format CHECK (tag ~ '^[A-Z0-9]+$'),
    CONSTRAINT no_self_parent CHECK (id != parent_guild_id)
);

-- Add main_guild_id to profiles if not exists
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS main_guild_id UUID REFERENCES guilds(id) ON DELETE SET NULL;

-- Guild Membership
CREATE TABLE IF NOT EXISTS guild_members (
    guild_id UUID NOT NULL REFERENCES guilds(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Role & Permissions
    role guild_role NOT NULL DEFAULT 'recruit',
    
    -- Contribution Tracking
    contribution_xp BIGINT NOT NULL DEFAULT 0 CHECK (contribution_xp >= 0),
    contribution_gold BIGINT NOT NULL DEFAULT 0 CHECK (contribution_gold >= 0),
    
    -- Metadata
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    PRIMARY KEY (guild_id, user_id)
);

-- Guild Relations (Diplomacy)
CREATE TABLE IF NOT EXISTS guild_relations (
    guild_id_a UUID NOT NULL REFERENCES guilds(id) ON DELETE CASCADE,
    guild_id_b UUID NOT NULL REFERENCES guilds(id) ON DELETE CASCADE,
    
    -- Relation Type
    status guild_relation_status NOT NULL DEFAULT 'neutral',
    
    -- War Tracking
    war_score_a INTEGER NOT NULL DEFAULT 0 CHECK (war_score_a >= 0),
    war_score_b INTEGER NOT NULL DEFAULT 0 CHECK (war_score_b >= 0),
    
    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    PRIMARY KEY (guild_id_a, guild_id_b),
    CONSTRAINT no_self_relation CHECK (guild_id_a != guild_id_b),
    CONSTRAINT ordered_relation CHECK (guild_id_a < guild_id_b)
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_guild_members_user_id ON guild_members(user_id);
CREATE INDEX IF NOT EXISTS idx_guild_members_role ON guild_members(role);
CREATE INDEX IF NOT EXISTS idx_guilds_parent ON guilds(parent_guild_id) WHERE parent_guild_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_guilds_recruiting ON guilds(is_recruiting) WHERE is_recruiting = true;
CREATE INDEX IF NOT EXISTS idx_guild_relations_status ON guild_relations(status);

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Get max member count based on guild level
CREATE OR REPLACE FUNCTION get_max_members(guild_level INTEGER)
RETURNS INTEGER AS $$
BEGIN
    RETURN 20 + (guild_level * 5);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Get current member count
CREATE OR REPLACE FUNCTION get_member_count(p_guild_id UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN (SELECT COUNT(*) FROM guild_members WHERE guild_id = p_guild_id);
END;
$$ LANGUAGE plpgsql STABLE;

-- Check if user can perform action based on role
CREATE OR REPLACE FUNCTION has_guild_permission(
    p_user_id UUID,
    p_guild_id UUID,
    p_required_role guild_role
)
RETURNS BOOLEAN AS $$
DECLARE
    v_user_role guild_role;
    v_role_hierarchy INTEGER;
    v_required_hierarchy INTEGER;
BEGIN
    -- Get user's role
    SELECT role INTO v_user_role
    FROM guild_members
    WHERE guild_id = p_guild_id AND user_id = p_user_id;
    
    IF v_user_role IS NULL THEN
        RETURN false;
    END IF;
    
    -- Role hierarchy: leader > officer > veteran > member > recruit
    v_role_hierarchy := CASE v_user_role
        WHEN 'leader' THEN 5
        WHEN 'officer' THEN 4
        WHEN 'veteran' THEN 3
        WHEN 'member' THEN 2
        WHEN 'recruit' THEN 1
    END;
    
    v_required_hierarchy := CASE p_required_role
        WHEN 'leader' THEN 5
        WHEN 'officer' THEN 4
        WHEN 'veteran' THEN 3
        WHEN 'member' THEN 2
        WHEN 'recruit' THEN 1
    END;
    
    RETURN v_role_hierarchy >= v_required_hierarchy;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- =====================================================
-- CORE MANAGEMENT FUNCTIONS
-- =====================================================

-- Create a new guild
CREATE OR REPLACE FUNCTION create_guild(
    p_name TEXT,
    p_tag VARCHAR(5),
    p_description TEXT,
    p_founder_id UUID
)
RETURNS UUID AS $$
DECLARE
    v_guild_id UUID;
    v_founder_level INTEGER;
BEGIN
    -- Validate founder exists and meets requirements
    SELECT level INTO v_founder_level
    FROM profiles
    WHERE id = p_founder_id;
    
    IF v_founder_level IS NULL THEN
        RAISE EXCEPTION 'User not found';
    END IF;
    
    IF v_founder_level < 10 THEN
        RAISE EXCEPTION 'Must be level 10 or higher to create a guild';
    END IF;
    
    -- Check if user is already in a guild
    IF EXISTS (SELECT 1 FROM guild_members WHERE user_id = p_founder_id) THEN
        RAISE EXCEPTION 'User is already in a guild';
    END IF;
    
    -- Create guild
    INSERT INTO guilds (name, tag, description)
    VALUES (p_name, UPPER(p_tag), p_description)
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

-- Join a guild
CREATE OR REPLACE FUNCTION join_guild(
    p_user_id UUID,
    p_guild_id UUID
)
RETURNS VOID AS $$
DECLARE
    v_guild guilds%ROWTYPE;
    v_user_level INTEGER;
    v_current_members INTEGER;
    v_max_members INTEGER;
BEGIN
    -- Get guild info
    SELECT * INTO v_guild FROM guilds WHERE id = p_guild_id;
    
    IF v_guild.id IS NULL THEN
        RAISE EXCEPTION 'Guild not found';
    END IF;
    
    -- Check if recruiting
    IF NOT v_guild.is_recruiting THEN
        RAISE EXCEPTION 'Guild is not recruiting';
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
    
    -- Check member capacity
    v_current_members := get_member_count(p_guild_id);
    v_max_members := get_max_members(v_guild.level);
    
    IF v_current_members >= v_max_members THEN
        RAISE EXCEPTION 'Guild is full (max % members)', v_max_members;
    END IF;
    
    -- Add member
    INSERT INTO guild_members (guild_id, user_id, role)
    VALUES (p_guild_id, p_user_id, 'recruit');
    
    -- Update user's main_guild_id
    UPDATE profiles
    SET main_guild_id = p_guild_id
    WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Leave a guild
CREATE OR REPLACE FUNCTION leave_guild(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
    v_guild_id UUID;
    v_role guild_role;
BEGIN
    -- Get user's guild and role
    SELECT guild_id, role INTO v_guild_id, v_role
    FROM guild_members
    WHERE user_id = p_user_id;
    
    IF v_guild_id IS NULL THEN
        RAISE EXCEPTION 'User is not in a guild';
    END IF;
    
    -- Leaders cannot leave (must transfer leadership first)
    IF v_role = 'leader' THEN
        RAISE EXCEPTION 'Guild leader must transfer leadership before leaving';
    END IF;
    
    -- Remove member
    DELETE FROM guild_members WHERE user_id = p_user_id;
    
    -- Clear user's main_guild_id
    UPDATE profiles
    SET main_guild_id = NULL
    WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Promote/demote member
CREATE OR REPLACE FUNCTION change_member_role(
    p_guild_id UUID,
    p_target_user_id UUID,
    p_new_role guild_role,
    p_acting_user_id UUID
)
RETURNS VOID AS $$
DECLARE
    v_acting_role guild_role;
    v_target_role guild_role;
BEGIN
    -- Get roles
    SELECT role INTO v_acting_role FROM guild_members WHERE guild_id = p_guild_id AND user_id = p_acting_user_id;
    SELECT role INTO v_target_role FROM guild_members WHERE guild_id = p_guild_id AND user_id = p_target_user_id;
    
    IF v_acting_role IS NULL THEN
        RAISE EXCEPTION 'Acting user is not in the guild';
    END IF;
    
    IF v_target_role IS NULL THEN
        RAISE EXCEPTION 'Target user is not in the guild';
    END IF;
    
    -- Only leaders can promote to officer or change leader role
    IF p_new_role = 'officer' OR p_new_role = 'leader' THEN
        IF v_acting_role != 'leader' THEN
            RAISE EXCEPTION 'Only guild leader can promote to officer or leader';
        END IF;
    END IF;
    
    -- Officers can promote up to veteran
    IF p_new_role IN ('veteran', 'member', 'recruit') THEN
        IF NOT has_guild_permission(p_acting_user_id, p_guild_id, 'officer') THEN
            RAISE EXCEPTION 'Insufficient permissions';
        END IF;
    END IF;
    
    -- Cannot demote yourself
    IF p_acting_user_id = p_target_user_id THEN
        RAISE EXCEPTION 'Cannot change your own role';
    END IF;
    
    -- If promoting to leader, demote current leader to officer
    IF p_new_role = 'leader' THEN
        UPDATE guild_members
        SET role = 'officer'
        WHERE guild_id = p_guild_id AND role = 'leader';
    END IF;
    
    -- Update role
    UPDATE guild_members
    SET role = p_new_role
    WHERE guild_id = p_guild_id AND user_id = p_target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Kick member from guild
CREATE OR REPLACE FUNCTION kick_member(
    p_guild_id UUID,
    p_target_user_id UUID,
    p_acting_user_id UUID
)
RETURNS VOID AS $$
DECLARE
    v_target_role guild_role;
BEGIN
    -- Check permissions
    IF NOT has_guild_permission(p_acting_user_id, p_guild_id, 'officer') THEN
        RAISE EXCEPTION 'Only officers and leaders can kick members';
    END IF;
    
    -- Get target role
    SELECT role INTO v_target_role FROM guild_members WHERE guild_id = p_guild_id AND user_id = p_target_user_id;
    
    IF v_target_role IS NULL THEN
        RAISE EXCEPTION 'User is not in the guild';
    END IF;
    
    -- Cannot kick leader
    IF v_target_role = 'leader' THEN
        RAISE EXCEPTION 'Cannot kick guild leader';
    END IF;
    
    -- Cannot kick yourself
    IF p_acting_user_id = p_target_user_id THEN
        RAISE EXCEPTION 'Cannot kick yourself';
    END IF;
    
    -- Remove member
    DELETE FROM guild_members WHERE guild_id = p_guild_id AND user_id = p_target_user_id;
    
    -- Clear user's main_guild_id
    UPDATE profiles
    SET main_guild_id = NULL
    WHERE id = p_target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update guild settings
CREATE OR REPLACE FUNCTION update_guild_settings(
    p_guild_id UUID,
    p_acting_user_id UUID,
    p_description TEXT DEFAULT NULL,
    p_is_recruiting BOOLEAN DEFAULT NULL,
    p_min_level_req INTEGER DEFAULT NULL,
    p_tax_rate INTEGER DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    -- Check permissions (leader only)
    IF NOT has_guild_permission(p_acting_user_id, p_guild_id, 'leader') THEN
        RAISE EXCEPTION 'Only guild leader can update settings';
    END IF;
    
    -- Update fields
    UPDATE guilds
    SET
        description = COALESCE(p_description, description),
        is_recruiting = COALESCE(p_is_recruiting, is_recruiting),
        min_level_req = COALESCE(p_min_level_req, min_level_req),
        tax_rate = COALESCE(p_tax_rate, tax_rate),
        updated_at = NOW()
    WHERE id = p_guild_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_guild_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_guilds_updated_at
    BEFORE UPDATE ON guilds
    FOR EACH ROW
    EXECUTE FUNCTION update_guild_timestamp();

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE guilds IS 'Main guild entity with progression, treasury, and settings';
COMMENT ON TABLE guild_members IS 'Guild membership with roles and contribution tracking';
COMMENT ON TABLE guild_relations IS 'Diplomatic relations between guilds (ally, war, etc.)';
COMMENT ON FUNCTION create_guild IS 'Create a new guild (requires level 10+)';
COMMENT ON FUNCTION join_guild IS 'Join an existing guild (checks requirements)';
COMMENT ON FUNCTION leave_guild IS 'Leave current guild (leaders must transfer first)';
COMMENT ON FUNCTION change_member_role IS 'Promote or demote a guild member';
COMMENT ON FUNCTION kick_member IS 'Remove a member from the guild (officer+ only)';
