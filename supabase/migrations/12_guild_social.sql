-- =====================================================
-- YAMIKO GUILD SYSTEM - PHASE 5: SOCIAL FEATURES
-- Migration: 12_guild_social.sql
-- Description: Trophies, jackpot, academies, and advanced social features
-- =====================================================

-- =====================================================
-- ENUMS
-- =====================================================

CREATE TYPE trophy_type AS ENUM (
    'dragon_head',
    'enemy_flag',
    'tournament_cup',
    'raid_clear_s',
    'raid_clear_ss',
    'territory_king',
    'war_victor',
    'contract_master',
    'legendary_crafter',
    'guild_founder'
);

-- =====================================================
-- TABLES
-- =====================================================

-- Guild Trophies (Achievement Museum)
CREATE TABLE guild_trophies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    guild_id UUID NOT NULL REFERENCES guilds(id) ON DELETE CASCADE,
    
    -- Trophy Details
    trophy_type trophy_type NOT NULL,
    display_name TEXT NOT NULL,
    description TEXT,
    
    -- Display
    display_slot INTEGER CHECK (display_slot >= 1 AND display_slot <= 20),
    icon_url TEXT,
    
    -- Metadata
    obtained_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    obtained_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    
    -- Context (What achievement unlocked this)
    context JSONB,
    
    -- Constraints
    UNIQUE (guild_id, trophy_type)
);

-- Guild Jackpot (Progressive Reward Pool)
CREATE TABLE guild_jackpot (
    guild_id UUID PRIMARY KEY REFERENCES guilds(id) ON DELETE CASCADE,
    
    -- Progress (0.0 to 100.0)
    progress_percent NUMERIC(5,2) NOT NULL DEFAULT 0.0 CHECK (progress_percent >= 0 AND progress_percent <= 100),
    
    -- Pool Value
    total_pool_gold BIGINT NOT NULL DEFAULT 0 CHECK (total_pool_gold >= 0),
    total_pool_rubies BIGINT NOT NULL DEFAULT 0 CHECK (total_pool_rubies >= 0),
    
    -- History
    total_distributions INTEGER NOT NULL DEFAULT 0,
    last_distributed_at TIMESTAMPTZ,
    
    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Jackpot Distribution History
CREATE TABLE jackpot_distributions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    guild_id UUID NOT NULL REFERENCES guilds(id) ON DELETE CASCADE,
    
    -- Total distributed
    total_gold BIGINT NOT NULL,
    total_rubies BIGINT NOT NULL,
    
    -- Distribution breakdown (JSONB for flexibility)
    distribution_data JSONB NOT NULL,
    -- Format: [{"user_id": "uuid", "gold": 1000, "rubies": 50, "reason": "top_contributor"}, ...]
    
    -- Timing
    distributed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Guild Academy Relations (Parent-Child System)
CREATE TABLE guild_academy_relations (
    parent_guild_id UUID NOT NULL REFERENCES guilds(id) ON DELETE CASCADE,
    academy_guild_id UUID NOT NULL REFERENCES guilds(id) ON DELETE CASCADE,
    
    -- Metadata
    established_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    PRIMARY KEY (parent_guild_id, academy_guild_id),
    CONSTRAINT no_self_academy CHECK (parent_guild_id != academy_guild_id)
);

-- Guild Announcements
CREATE TABLE guild_announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    guild_id UUID NOT NULL REFERENCES guilds(id) ON DELETE CASCADE,
    
    -- Content
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    
    -- Priority
    is_pinned BOOLEAN NOT NULL DEFAULT false,
    
    -- Author
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX idx_guild_trophies_guild ON guild_trophies(guild_id);
CREATE INDEX idx_guild_trophies_type ON guild_trophies(trophy_type);
CREATE INDEX idx_jackpot_distributions_guild ON jackpot_distributions(guild_id);
CREATE INDEX idx_guild_academy_parent ON guild_academy_relations(parent_guild_id);
CREATE INDEX idx_guild_academy_academy ON guild_academy_relations(academy_guild_id);
CREATE INDEX idx_guild_announcements_guild ON guild_announcements(guild_id);
CREATE INDEX idx_guild_announcements_pinned ON guild_announcements(is_pinned) WHERE is_pinned = true;

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Add progress to jackpot
CREATE OR REPLACE FUNCTION add_jackpot_progress(
    p_guild_id UUID,
    p_progress_increment NUMERIC,
    p_gold_contribution BIGINT DEFAULT 0,
    p_rubies_contribution BIGINT DEFAULT 0
)
RETURNS VOID AS $$
DECLARE
    v_new_progress NUMERIC;
BEGIN
    -- Create jackpot if doesn't exist
    INSERT INTO guild_jackpot (guild_id, progress_percent, total_pool_gold, total_pool_rubies)
    VALUES (p_guild_id, 0, 0, 0)
    ON CONFLICT (guild_id) DO NOTHING;
    
    -- Update progress and pool
    UPDATE guild_jackpot
    SET
        progress_percent = LEAST(100.0, progress_percent + p_progress_increment),
        total_pool_gold = total_pool_gold + p_gold_contribution,
        total_pool_rubies = total_pool_rubies + p_rubies_contribution,
        updated_at = NOW()
    WHERE guild_id = p_guild_id
    RETURNING progress_percent INTO v_new_progress;
    
    -- Auto-distribute if reached 100%
    IF v_new_progress >= 100.0 THEN
        PERFORM func_distribute_jackpot(p_guild_id);
    END IF;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- CORE SOCIAL FUNCTIONS
-- =====================================================

-- Award trophy to guild
CREATE OR REPLACE FUNCTION award_trophy(
    p_guild_id UUID,
    p_trophy_type trophy_type,
    p_display_name TEXT,
    p_description TEXT,
    p_obtained_by UUID DEFAULT NULL,
    p_context JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_trophy_id UUID;
    v_next_slot INTEGER;
BEGIN
    -- Check if trophy already exists
    IF EXISTS (SELECT 1 FROM guild_trophies WHERE guild_id = p_guild_id AND trophy_type = p_trophy_type) THEN
        RETURN NULL; -- Already have this trophy
    END IF;
    
    -- Find next available display slot
    SELECT COALESCE(MAX(display_slot), 0) + 1 INTO v_next_slot
    FROM guild_trophies
    WHERE guild_id = p_guild_id;
    
    -- Award trophy
    INSERT INTO guild_trophies (guild_id, trophy_type, display_name, description, display_slot, obtained_by, context)
    VALUES (p_guild_id, p_trophy_type, p_display_name, p_description, v_next_slot, p_obtained_by, p_context)
    RETURNING id INTO v_trophy_id;
    
    RETURN v_trophy_id;
END;
$$ LANGUAGE plpgsql;

-- Distribute jackpot to members
CREATE OR REPLACE FUNCTION func_distribute_jackpot(p_guild_id UUID)
RETURNS VOID AS $$
DECLARE
    v_jackpot guild_jackpot%ROWTYPE;
    v_member RECORD;
    v_total_contribution BIGINT;
    v_distribution_data JSONB := '[]'::jsonb;
    v_even_share_gold BIGINT;
    v_even_share_rubies BIGINT;
    v_contribution_share_gold BIGINT;
    v_contribution_share_rubies BIGINT;
    v_lottery_gold BIGINT;
    v_lottery_rubies BIGINT;
    v_member_gold BIGINT;
    v_member_rubies BIGINT;
    v_member_count INTEGER;
BEGIN
    -- Get jackpot data
    SELECT * INTO v_jackpot FROM guild_jackpot WHERE guild_id = p_guild_id;
    
    IF v_jackpot.progress_percent < 100.0 THEN
        RAISE EXCEPTION 'Jackpot is not ready for distribution (only % complete)', v_jackpot.progress_percent;
    END IF;
    
    IF v_jackpot.total_pool_gold = 0 AND v_jackpot.total_pool_rubies = 0 THEN
        RAISE EXCEPTION 'Jackpot pool is empty';
    END IF;
    
    -- Get member count
    SELECT COUNT(*) INTO v_member_count FROM guild_members WHERE guild_id = p_guild_id;
    
    IF v_member_count = 0 THEN
        RETURN; -- No members to distribute to
    END IF;
    
    -- Calculate total contribution
    SELECT SUM(contribution_gold) INTO v_total_contribution
    FROM guild_members
    WHERE guild_id = p_guild_id;
    
    v_total_contribution := COALESCE(v_total_contribution, 1); -- Avoid division by zero
    
    -- Distribution breakdown:
    -- 50% even split
    -- 30% by contribution
    -- 20% random lottery (goes to one lucky member)
    
    v_even_share_gold := FLOOR(v_jackpot.total_pool_gold * 0.5 / v_member_count);
    v_even_share_rubies := FLOOR(v_jackpot.total_pool_rubies * 0.5 / v_member_count);
    
    -- Distribute to all members
    FOR v_member IN
        SELECT user_id, contribution_gold
        FROM guild_members
        WHERE guild_id = p_guild_id
    LOOP
        -- Even share (50%)
        v_member_gold := v_even_share_gold;
        v_member_rubies := v_even_share_rubies;
        
        -- Contribution share (30%)
        v_contribution_share_gold := FLOOR(v_jackpot.total_pool_gold * 0.3 * v_member.contribution_gold / v_total_contribution);
        v_contribution_share_rubies := FLOOR(v_jackpot.total_pool_rubies * 0.3 * v_member.contribution_gold / v_total_contribution);
        
        v_member_gold := v_member_gold + v_contribution_share_gold;
        v_member_rubies := v_member_rubies + v_contribution_share_rubies;
        
        -- Give rewards
        UPDATE profiles
        SET
            gold = gold + v_member_gold,
            rubies = rubies + v_member_rubies
        WHERE id = v_member.user_id;
        
        -- Log distribution
        v_distribution_data := v_distribution_data || jsonb_build_object(
            'user_id', v_member.user_id,
            'gold', v_member_gold,
            'rubies', v_member_rubies,
            'reason', 'even_and_contribution'
        );
    END LOOP;
    
    -- Lottery winner (20%)
    v_lottery_gold := FLOOR(v_jackpot.total_pool_gold * 0.2);
    v_lottery_rubies := FLOOR(v_jackpot.total_pool_rubies * 0.2);
    
    -- Pick random winner
    SELECT user_id INTO v_member
    FROM guild_members
    WHERE guild_id = p_guild_id
    ORDER BY RANDOM()
    LIMIT 1;
    
    IF v_member.user_id IS NOT NULL THEN
        UPDATE profiles
        SET
            gold = gold + v_lottery_gold,
            rubies = rubies + v_lottery_rubies
        WHERE id = v_member.user_id;
        
        -- Log lottery winner
        v_distribution_data := v_distribution_data || jsonb_build_object(
            'user_id', v_member.user_id,
            'gold', v_lottery_gold,
            'rubies', v_lottery_rubies,
            'reason', 'lottery_winner'
        );
    END IF;
    
    -- Save distribution history
    INSERT INTO jackpot_distributions (guild_id, total_gold, total_rubies, distribution_data)
    VALUES (p_guild_id, v_jackpot.total_pool_gold, v_jackpot.total_pool_rubies, v_distribution_data);
    
    -- Reset jackpot
    UPDATE guild_jackpot
    SET
        progress_percent = 0,
        total_pool_gold = 0,
        total_pool_rubies = 0,
        total_distributions = total_distributions + 1,
        last_distributed_at = NOW(),
        updated_at = NOW()
    WHERE guild_id = p_guild_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create academy (sub-guild)
CREATE OR REPLACE FUNCTION create_academy(
    p_parent_guild_id UUID,
    p_academy_name TEXT,
    p_academy_tag VARCHAR(5),
    p_acting_user_id UUID
)
RETURNS UUID AS $$
DECLARE
    v_academy_id UUID;
BEGIN
    -- Check permissions (leader only)
    IF NOT has_guild_permission(p_acting_user_id, p_parent_guild_id, 'leader') THEN
        RAISE EXCEPTION 'Only guild leader can create academies';
    END IF;
    
    -- Create academy guild
    v_academy_id := create_guild(p_academy_name, p_academy_tag, 'Academy of ' || (SELECT name FROM guilds WHERE id = p_parent_guild_id), p_acting_user_id);
    
    -- Set parent reference
    UPDATE guilds
    SET parent_guild_id = p_parent_guild_id
    WHERE id = v_academy_id;
    
    -- Create academy relation
    INSERT INTO guild_academy_relations (parent_guild_id, academy_guild_id)
    VALUES (p_parent_guild_id, v_academy_id);
    
    RETURN v_academy_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Graduate member from academy to parent guild
CREATE OR REPLACE FUNCTION graduate_member(
    p_user_id UUID,
    p_from_academy_id UUID,
    p_to_parent_id UUID,
    p_acting_user_id UUID
)
RETURNS VOID AS $$
BEGIN
    -- Check permissions (officer+ in parent guild)
    IF NOT has_guild_permission(p_acting_user_id, p_to_parent_id, 'officer') THEN
        RAISE EXCEPTION 'Only officers and leaders of parent guild can graduate members';
    END IF;
    
    -- Verify academy relation
    IF NOT EXISTS (
        SELECT 1 FROM guild_academy_relations
        WHERE parent_guild_id = p_to_parent_id AND academy_guild_id = p_from_academy_id
    ) THEN
        RAISE EXCEPTION 'Invalid academy relation';
    END IF;
    
    -- Remove from academy
    DELETE FROM guild_members WHERE guild_id = p_from_academy_id AND user_id = p_user_id;
    
    -- Add to parent guild
    PERFORM join_guild(p_user_id, p_to_parent_id);
    
    -- Start as member (not recruit)
    UPDATE guild_members
    SET role = 'member'
    WHERE guild_id = p_to_parent_id AND user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create guild announcement
CREATE OR REPLACE FUNCTION create_announcement(
    p_guild_id UUID,
    p_title TEXT,
    p_message TEXT,
    p_is_pinned BOOLEAN,
    p_acting_user_id UUID
)
RETURNS UUID AS $$
DECLARE
    v_announcement_id UUID;
BEGIN
    -- Check permissions (officer+)
    IF NOT has_guild_permission(p_acting_user_id, p_guild_id, 'officer') THEN
        RAISE EXCEPTION 'Only officers and leaders can create announcements';
    END IF;
    
    -- Create announcement
    INSERT INTO guild_announcements (guild_id, title, message, is_pinned, created_by)
    VALUES (p_guild_id, p_title, p_message, p_is_pinned, p_acting_user_id)
    RETURNING id INTO v_announcement_id;
    
    RETURN v_announcement_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- TRIGGERS
-- =====================================================

CREATE OR REPLACE FUNCTION update_jackpot_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_guild_jackpot_updated_at
    BEFORE UPDATE ON guild_jackpot
    FOR EACH ROW
    EXECUTE FUNCTION update_jackpot_timestamp();

CREATE OR REPLACE FUNCTION update_announcement_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_guild_announcements_updated_at
    BEFORE UPDATE ON guild_announcements
    FOR EACH ROW
    EXECUTE FUNCTION update_announcement_timestamp();

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE guild_trophies IS 'Achievement trophies displayed in guild museum';
COMMENT ON TABLE guild_jackpot IS 'Progressive reward pool that distributes at 100%';
COMMENT ON TABLE jackpot_distributions IS 'Historical record of jackpot distributions';
COMMENT ON TABLE guild_academy_relations IS 'Parent-child guild relationships (academy system)';
COMMENT ON TABLE guild_announcements IS 'Guild news and announcements';
COMMENT ON FUNCTION award_trophy IS 'Award an achievement trophy to a guild';
COMMENT ON FUNCTION func_distribute_jackpot IS 'Distribute jackpot pool to all members (50% even, 30% contribution, 20% lottery)';
COMMENT ON FUNCTION create_academy IS 'Create a sub-guild (academy) under parent guild';
COMMENT ON FUNCTION graduate_member IS 'Promote member from academy to parent guild';
