-- =====================================================
-- YAMIKO GUILD SYSTEM - PHASE 2: ECONOMY & ESTATE
-- Migration: 09_guild_economy.sql
-- Description: Buildings, warehouse, buffs, tax system, and crafting
-- =====================================================

-- =====================================================
-- ENUMS
-- =====================================================

DO $$ BEGIN
    CREATE TYPE building_type AS ENUM ('mine', 'library', 'altar', 'barracks');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE buff_type AS ENUM ('xp_boost', 'drop_rate', 'damage_boost', 'gold_boost');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- =====================================================
-- TABLES
-- =====================================================

-- Guild Buildings (Estate System)
CREATE TABLE IF NOT EXISTS guild_buildings (
    guild_id UUID NOT NULL REFERENCES guilds(id) ON DELETE CASCADE,
    building_type building_type NOT NULL,
    level INTEGER NOT NULL DEFAULT 1 CHECK (level >= 1 AND level <= 10),
    
    -- Metadata
    built_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    upgraded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    PRIMARY KEY (guild_id, building_type)
);

-- Guild Warehouse (Shared Storage)
CREATE TABLE IF NOT EXISTS guild_warehouse (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    guild_id UUID NOT NULL REFERENCES guilds(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    
    -- Donation Tracking
    donated_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    donated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    UNIQUE (guild_id, item_id)
);

-- Guild Buffs (Active Effects)
CREATE TABLE IF NOT EXISTS guild_buffs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    guild_id UUID NOT NULL REFERENCES guilds(id) ON DELETE CASCADE,
    buff_type buff_type NOT NULL,
    
    -- Effect Strength
    multiplier NUMERIC(3,2) NOT NULL DEFAULT 1.5 CHECK (multiplier >= 1.0 AND multiplier <= 3.0),
    
    -- Duration
    activated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    
    -- Purchase Info
    purchased_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    cost_gold INTEGER NOT NULL DEFAULT 0,
    cost_rubies INTEGER NOT NULL DEFAULT 0
);

-- Guild Forge (Recycling/Crafting System)
CREATE TABLE IF NOT EXISTS guild_forge (
    guild_id UUID PRIMARY KEY REFERENCES guilds(id) ON DELETE CASCADE,
    scrap_points INTEGER NOT NULL DEFAULT 0 CHECK (scrap_points >= 0),
    total_crafted INTEGER NOT NULL DEFAULT 0 CHECK (total_crafted >= 0),
    next_craft_available_at TIMESTAMPTZ,
    
    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Guild Transaction Log (Audit Trail)
CREATE TABLE IF NOT EXISTS guild_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    guild_id UUID NOT NULL REFERENCES guilds(id) ON DELETE CASCADE,
    
    -- Transaction Details
    transaction_type TEXT NOT NULL, -- 'tax_income', 'building_income', 'withdrawal', 'buff_purchase', etc.
    amount_gold INTEGER NOT NULL DEFAULT 0,
    amount_rubies INTEGER NOT NULL DEFAULT 0,
    
    -- Actor
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    
    -- Context
    description TEXT,
    metadata JSONB,
    
    -- Timestamp
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_guild_warehouse_guild ON guild_warehouse(guild_id);
CREATE INDEX IF NOT EXISTS idx_guild_warehouse_item ON guild_warehouse(item_id);
CREATE INDEX IF NOT EXISTS idx_guild_buffs_guild ON guild_buffs(guild_id);
CREATE INDEX IF NOT EXISTS idx_guild_buffs_expires ON guild_buffs(expires_at);
CREATE INDEX IF NOT EXISTS idx_guild_transactions_guild ON guild_transactions(guild_id);
CREATE INDEX IF NOT EXISTS idx_guild_transactions_type ON guild_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_guild_transactions_created ON guild_transactions(created_at DESC);

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Get building income per hour
CREATE OR REPLACE FUNCTION get_building_income(
    p_building_type building_type,
    p_level INTEGER
)
RETURNS INTEGER AS $$
BEGIN
    RETURN CASE p_building_type
        WHEN 'mine' THEN p_level * 100        -- Gold generation
        WHEN 'library' THEN p_level * 50      -- XP generation
        WHEN 'altar' THEN p_level * 25        -- Ruby generation (rare)
        WHEN 'barracks' THEN 0                -- Provides raid damage bonus, not income
    END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Get building upgrade cost
CREATE OR REPLACE FUNCTION get_building_upgrade_cost(
    p_building_type building_type,
    p_current_level INTEGER
)
RETURNS INTEGER AS $$
DECLARE
    v_base_cost INTEGER;
BEGIN
    v_base_cost := CASE p_building_type
        WHEN 'mine' THEN 1000
        WHEN 'library' THEN 1500
        WHEN 'altar' THEN 2000
        WHEN 'barracks' THEN 1200
    END;
    
    -- Exponential scaling: base_cost * (1.5 ^ current_level)
    RETURN FLOOR(v_base_cost * POWER(1.5, p_current_level));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Check if guild has active buff
CREATE OR REPLACE FUNCTION has_active_buff(
    p_guild_id UUID,
    p_buff_type buff_type
)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM guild_buffs
        WHERE guild_id = p_guild_id
        AND buff_type = p_buff_type
        AND expires_at > NOW()
    );
END;
$$ LANGUAGE plpgsql STABLE;

-- Get active buff multiplier
CREATE OR REPLACE FUNCTION get_buff_multiplier(
    p_guild_id UUID,
    p_buff_type buff_type
)
RETURNS NUMERIC AS $$
DECLARE
    v_multiplier NUMERIC;
BEGIN
    SELECT multiplier INTO v_multiplier
    FROM guild_buffs
    WHERE guild_id = p_guild_id
    AND buff_type = p_buff_type
    AND expires_at > NOW()
    ORDER BY multiplier DESC
    LIMIT 1;
    
    RETURN COALESCE(v_multiplier, 1.0);
END;
$$ LANGUAGE plpgsql STABLE;

-- =====================================================
-- CORE ECONOMY FUNCTIONS
-- =====================================================

-- Process tax when user earns currency
CREATE OR REPLACE FUNCTION func_process_tax(
    p_user_id UUID,
    p_earnings_gold INTEGER,
    p_earnings_rubies INTEGER DEFAULT 0
)
RETURNS TABLE(user_receives_gold INTEGER, user_receives_rubies INTEGER, guild_receives_gold INTEGER, guild_receives_rubies INTEGER) AS $$
DECLARE
    v_guild_id UUID;
    v_tax_rate INTEGER;
    v_tax_gold INTEGER;
    v_tax_rubies INTEGER;
    v_user_gold INTEGER;
    v_user_rubies INTEGER;
BEGIN
    -- Get user's guild and tax rate
    SELECT gm.guild_id, g.tax_rate INTO v_guild_id, v_tax_rate
    FROM guild_members gm
    JOIN guilds g ON g.id = gm.guild_id
    WHERE gm.user_id = p_user_id;
    
    -- If not in guild, user gets 100%
    IF v_guild_id IS NULL THEN
        RETURN QUERY SELECT p_earnings_gold, p_earnings_rubies, 0, 0;
        RETURN;
    END IF;
    
    -- Calculate tax
    v_tax_gold := FLOOR(p_earnings_gold * v_tax_rate / 100.0);
    v_tax_rubies := FLOOR(p_earnings_rubies * v_tax_rate / 100.0);
    
    v_user_gold := p_earnings_gold - v_tax_gold;
    v_user_rubies := p_earnings_rubies - v_tax_rubies;
    
    -- Add tax to guild treasury
    IF v_tax_gold > 0 OR v_tax_rubies > 0 THEN
        UPDATE guilds
        SET
            treasury_gold = treasury_gold + v_tax_gold,
            treasury_rubies = treasury_rubies + v_tax_rubies
        WHERE id = v_guild_id;
        
        -- Update member contribution
        UPDATE guild_members
        SET contribution_gold = contribution_gold + v_tax_gold
        WHERE guild_id = v_guild_id AND user_id = p_user_id;
        
        -- Log transaction
        INSERT INTO guild_transactions (guild_id, transaction_type, amount_gold, amount_rubies, user_id, description)
        VALUES (v_guild_id, 'tax_income', v_tax_gold, v_tax_rubies, p_user_id, 'Tax collected from member earnings');
    END IF;
    
    RETURN QUERY SELECT v_user_gold, v_user_rubies, v_tax_gold, v_tax_rubies;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Upgrade a building
CREATE OR REPLACE FUNCTION upgrade_building(
    p_guild_id UUID,
    p_building_type building_type,
    p_acting_user_id UUID
)
RETURNS VOID AS $$
DECLARE
    v_current_level INTEGER;
    v_upgrade_cost INTEGER;
    v_treasury_gold BIGINT;
BEGIN
    -- Check permissions (officer+)
    IF NOT has_guild_permission(p_acting_user_id, p_guild_id, 'officer') THEN
        RAISE EXCEPTION 'Only officers and leaders can upgrade buildings';
    END IF;
    
    -- Get current level or create building
    SELECT level INTO v_current_level
    FROM guild_buildings
    WHERE guild_id = p_guild_id AND building_type = p_building_type;
    
    IF v_current_level IS NULL THEN
        -- Build new building (level 1)
        v_current_level := 0;
    END IF;
    
    IF v_current_level >= 10 THEN
        RAISE EXCEPTION 'Building is already at max level';
    END IF;
    
    -- Calculate cost
    v_upgrade_cost := get_building_upgrade_cost(p_building_type, v_current_level);
    
    -- Check treasury
    SELECT treasury_gold INTO v_treasury_gold FROM guilds WHERE id = p_guild_id;
    
    IF v_treasury_gold < v_upgrade_cost THEN
        RAISE EXCEPTION 'Insufficient guild treasury (need % gold)', v_upgrade_cost;
    END IF;
    
    -- Deduct cost
    UPDATE guilds
    SET treasury_gold = treasury_gold - v_upgrade_cost
    WHERE id = p_guild_id;
    
    -- Upgrade or create building
    INSERT INTO guild_buildings (guild_id, building_type, level)
    VALUES (p_guild_id, p_building_type, 1)
    ON CONFLICT (guild_id, building_type)
    DO UPDATE SET
        level = guild_buildings.level + 1,
        upgraded_at = NOW();
    
    -- Log transaction
    INSERT INTO guild_transactions (guild_id, transaction_type, amount_gold, user_id, description, metadata)
    VALUES (p_guild_id, 'building_upgrade', -v_upgrade_cost, p_acting_user_id,
            format('Upgraded %s to level %s', p_building_type, v_current_level + 1),
            jsonb_build_object('building_type', p_building_type, 'new_level', v_current_level + 1));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Donate item to warehouse
CREATE OR REPLACE FUNCTION donate_to_warehouse(
    p_user_id UUID,
    p_item_id UUID,
    p_quantity INTEGER
)
RETURNS VOID AS $$
DECLARE
    v_guild_id UUID;
    v_user_quantity INTEGER;
BEGIN
    -- Get user's guild
    SELECT guild_id INTO v_guild_id FROM guild_members WHERE user_id = p_user_id;
    
    IF v_guild_id IS NULL THEN
        RAISE EXCEPTION 'User is not in a guild';
    END IF;
    
    -- Check user has the item
    SELECT quantity INTO v_user_quantity
    FROM user_inventory
    WHERE user_id = p_user_id AND item_id = p_item_id;
    
    IF v_user_quantity IS NULL OR v_user_quantity < p_quantity THEN
        RAISE EXCEPTION 'Insufficient items in inventory';
    END IF;
    
    -- Remove from user inventory
    UPDATE user_inventory
    SET quantity = quantity - p_quantity
    WHERE user_id = p_user_id AND item_id = p_item_id;
    
    -- Delete if quantity reaches 0
    DELETE FROM user_inventory
    WHERE user_id = p_user_id AND item_id = p_item_id AND quantity <= 0;
    
    -- Add to warehouse
    INSERT INTO guild_warehouse (guild_id, item_id, quantity, donated_by)
    VALUES (v_guild_id, p_item_id, p_quantity, p_user_id)
    ON CONFLICT (guild_id, item_id)
    DO UPDATE SET
        quantity = guild_warehouse.quantity + p_quantity,
        donated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Withdraw item from warehouse
CREATE OR REPLACE FUNCTION withdraw_from_warehouse(
    p_guild_id UUID,
    p_item_id UUID,
    p_quantity INTEGER,
    p_user_id UUID,
    p_acting_user_id UUID
)
RETURNS VOID AS $$
DECLARE
    v_warehouse_quantity INTEGER;
BEGIN
    -- Check permissions (officer+)
    IF NOT has_guild_permission(p_acting_user_id, p_guild_id, 'officer') THEN
        RAISE EXCEPTION 'Only officers and leaders can withdraw from warehouse';
    END IF;
    
    -- Check warehouse has the item
    SELECT quantity INTO v_warehouse_quantity
    FROM guild_warehouse
    WHERE guild_id = p_guild_id AND item_id = p_item_id;
    
    IF v_warehouse_quantity IS NULL OR v_warehouse_quantity < p_quantity THEN
        RAISE EXCEPTION 'Insufficient items in warehouse';
    END IF;
    
    -- Remove from warehouse
    UPDATE guild_warehouse
    SET quantity = quantity - p_quantity
    WHERE guild_id = p_guild_id AND item_id = p_item_id;
    
    -- Delete if quantity reaches 0
    DELETE FROM guild_warehouse
    WHERE guild_id = p_guild_id AND item_id = p_item_id AND quantity <= 0;
    
    -- Add to user inventory
    INSERT INTO user_inventory (user_id, item_id, quantity)
    VALUES (p_user_id, p_item_id, p_quantity)
    ON CONFLICT (user_id, item_id)
    DO UPDATE SET quantity = user_inventory.quantity + p_quantity;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Purchase guild buff
CREATE OR REPLACE FUNCTION purchase_guild_buff(
    p_guild_id UUID,
    p_buff_type buff_type,
    p_duration_hours INTEGER,
    p_acting_user_id UUID
)
RETURNS UUID AS $$
DECLARE
    v_buff_id UUID;
    v_cost_gold INTEGER;
    v_cost_rubies INTEGER;
    v_treasury_gold BIGINT;
    v_treasury_rubies BIGINT;
    v_multiplier NUMERIC;
BEGIN
    -- Check permissions (officer+)
    IF NOT has_guild_permission(p_acting_user_id, p_guild_id, 'officer') THEN
        RAISE EXCEPTION 'Only officers and leaders can purchase buffs';
    END IF;
    
    -- Calculate cost based on buff type and duration
    v_cost_gold := CASE p_buff_type
        WHEN 'xp_boost' THEN 5000
        WHEN 'drop_rate' THEN 7500
        WHEN 'damage_boost' THEN 6000
        WHEN 'gold_boost' THEN 8000
    END * p_duration_hours;
    
    v_cost_rubies := FLOOR(v_cost_gold / 100.0); -- 1% of gold cost in rubies
    
    v_multiplier := 1.5; -- Standard 50% boost
    
    -- Check treasury
    SELECT treasury_gold, treasury_rubies INTO v_treasury_gold, v_treasury_rubies
    FROM guilds WHERE id = p_guild_id;
    
    IF v_treasury_gold < v_cost_gold THEN
        RAISE EXCEPTION 'Insufficient gold in treasury (need %)', v_cost_gold;
    END IF;
    
    IF v_treasury_rubies < v_cost_rubies THEN
        RAISE EXCEPTION 'Insufficient rubies in treasury (need %)', v_cost_rubies;
    END IF;
    
    -- Deduct cost
    UPDATE guilds
    SET
        treasury_gold = treasury_gold - v_cost_gold,
        treasury_rubies = treasury_rubies - v_cost_rubies
    WHERE id = p_guild_id;
    
    -- Create buff
    INSERT INTO guild_buffs (guild_id, buff_type, multiplier, expires_at, purchased_by, cost_gold, cost_rubies)
    VALUES (p_guild_id, p_buff_type, v_multiplier, NOW() + (p_duration_hours || ' hours')::INTERVAL,
            p_acting_user_id, v_cost_gold, v_cost_rubies)
    RETURNING id INTO v_buff_id;
    
    -- Log transaction
    INSERT INTO guild_transactions (guild_id, transaction_type, amount_gold, amount_rubies, user_id, description, metadata)
    VALUES (p_guild_id, 'buff_purchase', -v_cost_gold, -v_cost_rubies, p_acting_user_id,
            format('Purchased %s buff for %s hours', p_buff_type, p_duration_hours),
            jsonb_build_object('buff_type', p_buff_type, 'duration_hours', p_duration_hours, 'buff_id', v_buff_id));
    
    RETURN v_buff_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Craft artifact from scrap
CREATE OR REPLACE FUNCTION func_craft_artifact(p_guild_id UUID, p_acting_user_id UUID)
RETURNS UUID AS $$
DECLARE
    v_scrap_points INTEGER;
    v_random_item_id UUID;
    v_item_id UUID;
    v_craft_cooldown TIMESTAMPTZ;
BEGIN
    -- Check permissions (officer+)
    IF NOT has_guild_permission(p_acting_user_id, p_guild_id, 'officer') THEN
        RAISE EXCEPTION 'Only officers and leaders can craft artifacts';
    END IF;
    
    -- Get forge data
    SELECT scrap_points, next_craft_available_at INTO v_scrap_points, v_craft_cooldown
    FROM guild_forge
    WHERE guild_id = p_guild_id;
    
    -- Create forge if doesn't exist
    IF v_scrap_points IS NULL THEN
        INSERT INTO guild_forge (guild_id, scrap_points)
        VALUES (p_guild_id, 0)
        RETURNING scrap_points INTO v_scrap_points;
    END IF;
    
    -- Check cooldown
    IF v_craft_cooldown IS NOT NULL AND v_craft_cooldown > NOW() THEN
        RAISE EXCEPTION 'Crafting is on cooldown until %', v_craft_cooldown;
    END IF;
    
    -- Check scrap points
    IF v_scrap_points < 1000 THEN
        RAISE EXCEPTION 'Insufficient scrap points (need 1000, have %)', v_scrap_points;
    END IF;
    
    -- Deduct scrap points
    UPDATE guild_forge
    SET
        scrap_points = scrap_points - 1000,
        total_crafted = total_crafted + 1,
        next_craft_available_at = NOW() + INTERVAL '24 hours',
        updated_at = NOW()
    WHERE guild_id = p_guild_id;
    
    -- Select random item (rarity-weighted)
    SELECT id INTO v_random_item_id
    FROM items
    WHERE rarity IN ('rare', 'epic', 'legendary')
    ORDER BY RANDOM()
    LIMIT 1;
    
    IF v_random_item_id IS NULL THEN
        RAISE EXCEPTION 'No craftable items found in database';
    END IF;
    
    -- Add to warehouse
    INSERT INTO guild_warehouse (guild_id, item_id, quantity, donated_by)
    VALUES (p_guild_id, v_random_item_id, 1, p_acting_user_id)
    ON CONFLICT (guild_id, item_id)
    DO UPDATE SET quantity = guild_warehouse.quantity + 1
    RETURNING id INTO v_item_id;
    
    RETURN v_item_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add scrap points (called when items are recycled)
CREATE OR REPLACE FUNCTION add_scrap_points(
    p_guild_id UUID,
    p_points INTEGER
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO guild_forge (guild_id, scrap_points)
    VALUES (p_guild_id, p_points)
    ON CONFLICT (guild_id)
    DO UPDATE SET
        scrap_points = guild_forge.scrap_points + p_points,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- PASSIVE INCOME CRON (Called hourly by scheduler)
-- =====================================================

CREATE OR REPLACE FUNCTION passive_income_cron()
RETURNS VOID AS $$
DECLARE
    v_guild RECORD;
    v_building RECORD;
    v_total_gold INTEGER;
    v_total_xp INTEGER;
    v_total_rubies INTEGER;
BEGIN
    -- Process each guild
    FOR v_guild IN SELECT id FROM guilds LOOP
        v_total_gold := 0;
        v_total_xp := 0;
        v_total_rubies := 0;
        
        -- Calculate income from all buildings
        FOR v_building IN
            SELECT building_type, level
            FROM guild_buildings
            WHERE guild_id = v_guild.id
        LOOP
            CASE v_building.building_type
                WHEN 'mine' THEN
                    v_total_gold := v_total_gold + (v_building.level * 100);
                WHEN 'library' THEN
                    v_total_xp := v_total_xp + (v_building.level * 50);
                WHEN 'altar' THEN
                    v_total_rubies := v_total_rubies + (v_building.level * 25);
            END CASE;
        END LOOP;
        
        -- Add to treasury
        IF v_total_gold > 0 OR v_total_rubies > 0 THEN
            UPDATE guilds
            SET
                treasury_gold = treasury_gold + v_total_gold,
                treasury_rubies = treasury_rubies + v_total_rubies
            WHERE id = v_guild.id;
            
            -- Log transaction
            INSERT INTO guild_transactions (guild_id, transaction_type, amount_gold, amount_rubies, description, metadata)
            VALUES (v_guild.id, 'building_income', v_total_gold, v_total_rubies,
                    'Hourly passive income from buildings',
                    jsonb_build_object('gold', v_total_gold, 'rubies', v_total_rubies));
        END IF;
        
        -- Add XP to guild
        IF v_total_xp > 0 THEN
            UPDATE guilds
            SET xp = xp + v_total_xp
            WHERE id = v_guild.id;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Auto-update forge timestamp
CREATE OR REPLACE FUNCTION update_forge_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_guild_forge_updated_at
    BEFORE UPDATE ON guild_forge
    FOR EACH ROW
    EXECUTE FUNCTION update_forge_timestamp();

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE guild_buildings IS 'Guild estate buildings providing passive income and bonuses';
COMMENT ON TABLE guild_warehouse IS 'Shared item storage for guild members';
COMMENT ON TABLE guild_buffs IS 'Active temporary buffs purchased by the guild';
COMMENT ON TABLE guild_forge IS 'Crafting system using scrap points from recycled items';
COMMENT ON TABLE guild_transactions IS 'Audit log of all guild financial transactions';
COMMENT ON FUNCTION func_process_tax IS 'Calculate and apply guild tax to user earnings';
COMMENT ON FUNCTION upgrade_building IS 'Upgrade a guild building (costs gold from treasury)';
COMMENT ON FUNCTION func_craft_artifact IS 'Craft a random item using 1000 scrap points';
COMMENT ON FUNCTION passive_income_cron IS 'Hourly cron job to generate building income for all guilds';
