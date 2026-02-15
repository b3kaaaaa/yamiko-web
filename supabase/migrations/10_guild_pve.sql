-- =====================================================
-- YAMIKO GUILD SYSTEM - PHASE 3: PvE CONTENT
-- Migration: 10_guild_pve.sql
-- Description: Raid bosses, damage tracking, contracts, and loot
-- =====================================================

-- =====================================================
-- ENUMS
-- =====================================================

CREATE TYPE raid_status AS ENUM ('active', 'defeated', 'failed');
CREATE TYPE boss_tier AS ENUM ('common', 'rare', 'epic', 'legendary', 'mythic');

-- =====================================================
-- TABLES
-- =====================================================

-- Boss Definitions (Templates)
CREATE TABLE boss_definitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    
    -- Stats
    tier boss_tier NOT NULL DEFAULT 'common',
    base_hp BIGINT NOT NULL CHECK (base_hp > 0),
    hp_scaling_per_level BIGINT NOT NULL DEFAULT 10000,
    
    -- Appearance
    avatar_url TEXT,
    
    -- Loot Table (JSONB for flexibility)
    loot_table JSONB NOT NULL DEFAULT '[]'::jsonb,
    -- Format: [{"item_id": "uuid", "quantity": 1, "chance": 0.5}, ...]
    
    guaranteed_gold INTEGER NOT NULL DEFAULT 1000,
    guaranteed_xp INTEGER NOT NULL DEFAULT 500,
    
    -- Requirements
    min_guild_level INTEGER NOT NULL DEFAULT 1,
    
    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Active Guild Raids
CREATE TABLE guild_raids (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    guild_id UUID NOT NULL REFERENCES guilds(id) ON DELETE CASCADE,
    boss_id UUID NOT NULL REFERENCES boss_definitions(id) ON DELETE CASCADE,
    
    -- HP Tracking
    current_hp BIGINT NOT NULL CHECK (current_hp >= 0),
    max_hp BIGINT NOT NULL CHECK (max_hp > 0),
    
    -- Status
    status raid_status NOT NULL DEFAULT 'active',
    
    -- Timing
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ends_at TIMESTAMPTZ NOT NULL,
    completed_at TIMESTAMPTZ,
    
    -- Constraints
    CONSTRAINT valid_hp CHECK (current_hp <= max_hp)
);

-- Raid Damage Logs (Leaderboard)
CREATE TABLE raid_logs (
    raid_id UUID NOT NULL REFERENCES guild_raids(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Damage Stats
    damage_dealt BIGINT NOT NULL DEFAULT 0 CHECK (damage_dealt >= 0),
    attacks_count INTEGER NOT NULL DEFAULT 0 CHECK (attacks_count >= 0),
    
    -- Timestamps
    first_attack_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_attack_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    PRIMARY KEY (raid_id, user_id)
);

-- Guild Contracts (Weekly Bingo/Grid Challenges)
CREATE TABLE guild_contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    guild_id UUID NOT NULL REFERENCES guilds(id) ON DELETE CASCADE,
    
    -- Week Tracking
    week_number INTEGER NOT NULL,
    year INTEGER NOT NULL,
    
    -- Grid State (5x5 Bingo Board)
    grid_state JSONB NOT NULL DEFAULT '{}'::jsonb,
    -- Format: {"0-0": {"task": "read_100_chapters", "progress": 50, "target": 100, "completed": false}, ...}
    
    -- Completion
    is_completed BOOLEAN NOT NULL DEFAULT false,
    completed_at TIMESTAMPTZ,
    
    -- Rewards
    reward_claimed BOOLEAN NOT NULL DEFAULT false,
    
    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    UNIQUE (guild_id, week_number, year)
);

-- Raid Loot Distribution
CREATE TABLE raid_loot (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    raid_id UUID NOT NULL REFERENCES guild_raids(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Loot
    item_id UUID REFERENCES items(id) ON DELETE SET NULL,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    gold_reward INTEGER NOT NULL DEFAULT 0,
    xp_reward INTEGER NOT NULL DEFAULT 0,
    
    -- Metadata
    awarded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX idx_guild_raids_guild ON guild_raids(guild_id);
CREATE INDEX idx_guild_raids_status ON guild_raids(status);
CREATE INDEX idx_guild_raids_ends_at ON guild_raids(ends_at);
CREATE INDEX idx_raid_logs_raid ON raid_logs(raid_id);
CREATE INDEX idx_raid_logs_user ON raid_logs(user_id);
CREATE INDEX idx_raid_logs_damage ON raid_logs(damage_dealt DESC);
CREATE INDEX idx_guild_contracts_guild ON guild_contracts(guild_id);
CREATE INDEX idx_guild_contracts_week ON guild_contracts(week_number, year);
CREATE INDEX idx_raid_loot_raid ON raid_loot(raid_id);
CREATE INDEX idx_raid_loot_user ON raid_loot(user_id);

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Calculate damage based on chapters read
CREATE OR REPLACE FUNCTION calculate_raid_damage(
    p_user_id UUID,
    p_guild_id UUID,
    p_chapter_count INTEGER
)
RETURNS BIGINT AS $$
DECLARE
    v_base_damage BIGINT;
    v_class_multiplier NUMERIC;
    v_buff_multiplier NUMERIC;
    v_barracks_level INTEGER;
    v_barracks_bonus NUMERIC;
BEGIN
    -- Base damage: 10 per chapter
    v_base_damage := p_chapter_count * 10;
    
    -- Get user's class multiplier
    SELECT CASE c.name
        WHEN 'Warrior' THEN 1.5
        WHEN 'Mage' THEN 1.3
        WHEN 'Assassin' THEN 1.2
        ELSE 1.0
    END INTO v_class_multiplier
    FROM profiles p
    LEFT JOIN classes c ON c.id = p.class_id
    WHERE p.id = p_user_id;
    
    v_class_multiplier := COALESCE(v_class_multiplier, 1.0);
    
    -- Get guild damage buff
    v_buff_multiplier := get_buff_multiplier(p_guild_id, 'damage_boost');
    
    -- Get barracks bonus (10% per level)
    SELECT level INTO v_barracks_level
    FROM guild_buildings
    WHERE guild_id = p_guild_id AND building_type = 'barracks';
    
    v_barracks_bonus := 1.0 + (COALESCE(v_barracks_level, 0) * 0.1);
    
    -- Total damage
    RETURN FLOOR(v_base_damage * v_class_multiplier * v_buff_multiplier * v_barracks_bonus);
END;
$$ LANGUAGE plpgsql STABLE;

-- Get current week number
CREATE OR REPLACE FUNCTION get_current_week()
RETURNS TABLE(week_number INTEGER, year INTEGER) AS $$
BEGIN
    RETURN QUERY SELECT
        EXTRACT(WEEK FROM NOW())::INTEGER,
        EXTRACT(YEAR FROM NOW())::INTEGER;
END;
$$ LANGUAGE plpgsql STABLE;

-- =====================================================
-- CORE PvE FUNCTIONS
-- =====================================================

-- Start a new raid
CREATE OR REPLACE FUNCTION start_raid(
    p_guild_id UUID,
    p_boss_id UUID,
    p_acting_user_id UUID
)
RETURNS UUID AS $$
DECLARE
    v_raid_id UUID;
    v_boss boss_definitions%ROWTYPE;
    v_guild_level INTEGER;
    v_max_hp BIGINT;
    v_duration_hours INTEGER;
BEGIN
    -- Check permissions (officer+)
    IF NOT has_guild_permission(p_acting_user_id, p_guild_id, 'officer') THEN
        RAISE EXCEPTION 'Only officers and leaders can start raids';
    END IF;
    
    -- Check if guild already has an active raid
    IF EXISTS (SELECT 1 FROM guild_raids WHERE guild_id = p_guild_id AND status = 'active') THEN
        RAISE EXCEPTION 'Guild already has an active raid';
    END IF;
    
    -- Get boss definition
    SELECT * INTO v_boss FROM boss_definitions WHERE id = p_boss_id;
    
    IF v_boss.id IS NULL THEN
        RAISE EXCEPTION 'Boss not found';
    END IF;
    
    -- Get guild level
    SELECT level INTO v_guild_level FROM guilds WHERE id = p_guild_id;
    
    -- Check guild level requirement
    IF v_guild_level < v_boss.min_guild_level THEN
        RAISE EXCEPTION 'Guild level too low (need level %)', v_boss.min_guild_level;
    END IF;
    
    -- Calculate boss HP based on guild level
    v_max_hp := v_boss.base_hp + (v_guild_level * v_boss.hp_scaling_per_level);
    
    -- Duration based on tier
    v_duration_hours := CASE v_boss.tier
        WHEN 'common' THEN 24
        WHEN 'rare' THEN 48
        WHEN 'epic' THEN 72
        WHEN 'legendary' THEN 96
        WHEN 'mythic' THEN 120
    END;
    
    -- Create raid
    INSERT INTO guild_raids (guild_id, boss_id, current_hp, max_hp, ends_at)
    VALUES (p_guild_id, p_boss_id, v_max_hp, v_max_hp, NOW() + (v_duration_hours || ' hours')::INTERVAL)
    RETURNING id INTO v_raid_id;
    
    RETURN v_raid_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Deal damage to raid boss
CREATE OR REPLACE FUNCTION func_deal_raid_damage(
    p_user_id UUID,
    p_chapter_count INTEGER
)
RETURNS BIGINT AS $$
DECLARE
    v_guild_id UUID;
    v_raid_id UUID;
    v_damage BIGINT;
    v_current_hp BIGINT;
BEGIN
    -- Get user's guild
    SELECT guild_id INTO v_guild_id FROM guild_members WHERE user_id = p_user_id;
    
    IF v_guild_id IS NULL THEN
        RAISE EXCEPTION 'User is not in a guild';
    END IF;
    
    -- Get active raid
    SELECT id, current_hp INTO v_raid_id, v_current_hp
    FROM guild_raids
    WHERE guild_id = v_guild_id AND status = 'active'
    ORDER BY started_at DESC
    LIMIT 1;
    
    IF v_raid_id IS NULL THEN
        RAISE EXCEPTION 'No active raid found';
    END IF;
    
    -- Calculate damage
    v_damage := calculate_raid_damage(p_user_id, v_guild_id, p_chapter_count);
    
    -- Update raid HP
    UPDATE guild_raids
    SET current_hp = GREATEST(0, current_hp - v_damage)
    WHERE id = v_raid_id
    RETURNING current_hp INTO v_current_hp;
    
    -- Log damage
    INSERT INTO raid_logs (raid_id, user_id, damage_dealt, attacks_count, last_attack_at)
    VALUES (v_raid_id, p_user_id, v_damage, 1, NOW())
    ON CONFLICT (raid_id, user_id)
    DO UPDATE SET
        damage_dealt = raid_logs.damage_dealt + v_damage,
        attacks_count = raid_logs.attacks_count + 1,
        last_attack_at = NOW();
    
    -- Update member contribution XP
    UPDATE guild_members
    SET contribution_xp = contribution_xp + (v_damage / 10)
    WHERE guild_id = v_guild_id AND user_id = p_user_id;
    
    -- Check if boss is defeated
    IF v_current_hp <= 0 THEN
        PERFORM complete_raid(v_raid_id);
    END IF;
    
    RETURN v_damage;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Complete raid and distribute loot
CREATE OR REPLACE FUNCTION complete_raid(p_raid_id UUID)
RETURNS VOID AS $$
DECLARE
    v_raid guild_raids%ROWTYPE;
    v_boss boss_definitions%ROWTYPE;
    v_participant RECORD;
    v_loot_item RECORD;
    v_total_damage BIGINT;
    v_damage_share NUMERIC;
    v_gold_reward INTEGER;
    v_xp_reward INTEGER;
BEGIN
    -- Get raid info
    SELECT * INTO v_raid FROM guild_raids WHERE id = p_raid_id;
    
    IF v_raid.status != 'active' THEN
        RETURN; -- Already completed
    END IF;
    
    -- Get boss info
    SELECT * INTO v_boss FROM boss_definitions WHERE id = v_raid.boss_id;
    
    -- Mark raid as defeated
    UPDATE guild_raids
    SET
        status = 'defeated',
        completed_at = NOW()
    WHERE id = p_raid_id;
    
    -- Get total damage dealt
    SELECT SUM(damage_dealt) INTO v_total_damage
    FROM raid_logs
    WHERE raid_id = p_raid_id;
    
    IF v_total_damage IS NULL OR v_total_damage = 0 THEN
        RETURN; -- No participants
    END IF;
    
    -- Distribute rewards to participants
    FOR v_participant IN
        SELECT user_id, damage_dealt
        FROM raid_logs
        WHERE raid_id = p_raid_id
        ORDER BY damage_dealt DESC
    LOOP
        -- Calculate damage share (0.0 to 1.0)
        v_damage_share := v_participant.damage_dealt::NUMERIC / v_total_damage::NUMERIC;
        
        -- Base rewards
        v_gold_reward := FLOOR(v_boss.guaranteed_gold * v_damage_share);
        v_xp_reward := FLOOR(v_boss.guaranteed_xp * v_damage_share);
        
        -- Give rewards to user
        UPDATE profiles
        SET
            gold = gold + v_gold_reward,
            exp = exp + v_xp_reward
        WHERE id = v_participant.user_id;
        
        -- Log loot
        INSERT INTO raid_loot (raid_id, user_id, gold_reward, xp_reward)
        VALUES (p_raid_id, v_participant.user_id, v_gold_reward, v_xp_reward);
        
        -- Roll for item drops (loot table)
        FOR v_loot_item IN
            SELECT
                (item->>'item_id')::UUID as item_id,
                (item->>'quantity')::INTEGER as quantity,
                (item->>'chance')::NUMERIC as chance
            FROM jsonb_array_elements(v_boss.loot_table) as item
        LOOP
            -- Random roll
            IF RANDOM() <= v_loot_item.chance THEN
                -- Award item
                INSERT INTO user_inventory (user_id, item_id, quantity)
                VALUES (v_participant.user_id, v_loot_item.item_id, v_loot_item.quantity)
                ON CONFLICT (user_id, item_id)
                DO UPDATE SET quantity = user_inventory.quantity + v_loot_item.quantity;
                
                -- Log item loot
                INSERT INTO raid_loot (raid_id, user_id, item_id, quantity, gold_reward, xp_reward)
                VALUES (p_raid_id, v_participant.user_id, v_loot_item.item_id, v_loot_item.quantity, 0, 0);
            END IF;
        END LOOP;
    END LOOP;
    
    -- Add guild XP
    UPDATE guilds
    SET xp = xp + v_boss.guaranteed_xp
    WHERE id = v_raid.guild_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update contract progress
CREATE OR REPLACE FUNCTION update_contract_progress(
    p_guild_id UUID,
    p_task_key TEXT,
    p_progress_increment INTEGER
)
RETURNS VOID AS $$
DECLARE
    v_contract_id UUID;
    v_week INTEGER;
    v_year INTEGER;
    v_grid_state JSONB;
    v_task JSONB;
    v_new_progress INTEGER;
    v_target INTEGER;
BEGIN
    -- Get current week
    SELECT * INTO v_week, v_year FROM get_current_week();
    
    -- Get or create contract
    SELECT id, grid_state INTO v_contract_id, v_grid_state
    FROM guild_contracts
    WHERE guild_id = p_guild_id AND week_number = v_week AND year = v_year;
    
    IF v_contract_id IS NULL THEN
        -- Create new contract for this week
        INSERT INTO guild_contracts (guild_id, week_number, year, grid_state)
        VALUES (p_guild_id, v_week, v_year, '{}'::jsonb)
        RETURNING id, grid_state INTO v_contract_id, v_grid_state;
    END IF;
    
    -- Get task from grid
    v_task := v_grid_state->p_task_key;
    
    IF v_task IS NULL THEN
        RETURN; -- Task doesn't exist in grid
    END IF;
    
    -- Update progress
    v_new_progress := COALESCE((v_task->>'progress')::INTEGER, 0) + p_progress_increment;
    v_target := (v_task->>'target')::INTEGER;
    
    -- Update task in grid
    v_grid_state := jsonb_set(
        v_grid_state,
        ARRAY[p_task_key, 'progress'],
        to_jsonb(v_new_progress)
    );
    
    -- Mark as completed if target reached
    IF v_new_progress >= v_target THEN
        v_grid_state := jsonb_set(
            v_grid_state,
            ARRAY[p_task_key, 'completed'],
            'true'::jsonb
        );
    END IF;
    
    -- Save grid state
    UPDATE guild_contracts
    SET
        grid_state = v_grid_state,
        updated_at = NOW()
    WHERE id = v_contract_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- CRON JOBS
-- =====================================================

-- Check for expired raids (run every hour)
CREATE OR REPLACE FUNCTION expire_raids_cron()
RETURNS VOID AS $$
BEGIN
    UPDATE guild_raids
    SET
        status = 'failed',
        completed_at = NOW()
    WHERE status = 'active'
    AND ends_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- TRIGGERS
-- =====================================================

CREATE OR REPLACE FUNCTION update_contract_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_guild_contracts_updated_at
    BEFORE UPDATE ON guild_contracts
    FOR EACH ROW
    EXECUTE FUNCTION update_contract_timestamp();

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE boss_definitions IS 'Raid boss templates with stats and loot tables';
COMMENT ON TABLE guild_raids IS 'Active raid instances with HP tracking';
COMMENT ON TABLE raid_logs IS 'Damage leaderboard for each raid';
COMMENT ON TABLE guild_contracts IS 'Weekly bingo/grid challenge system';
COMMENT ON TABLE raid_loot IS 'Distributed loot from completed raids';
COMMENT ON FUNCTION start_raid IS 'Start a new raid boss battle (officer+ only)';
COMMENT ON FUNCTION func_deal_raid_damage IS 'Deal damage to active raid based on chapters read';
COMMENT ON FUNCTION complete_raid IS 'Complete raid and distribute loot to participants';
COMMENT ON FUNCTION update_contract_progress IS 'Update progress on weekly contract tasks';
