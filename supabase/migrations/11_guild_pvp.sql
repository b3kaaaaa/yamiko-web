-- =====================================================
-- YAMIKO GUILD SYSTEM - PHASE 4: PvP & DIPLOMACY
-- Migration: 11_guild_pvp.sql
-- Description: Wars, territories, mercenaries, and diplomacy
-- =====================================================

-- =====================================================
-- ENUMS
-- =====================================================

CREATE TYPE war_priority AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE mercenary_status AS ENUM ('available', 'hired', 'inactive');

-- =====================================================
-- TABLES
-- =====================================================

-- Territory Control (Manga Patronage)
CREATE TABLE territory_control (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    manga_id UUID NOT NULL REFERENCES manga(id) ON DELETE CASCADE,
    guild_id UUID NOT NULL REFERENCES guilds(id) ON DELETE CASCADE,
    
    -- Economics
    weekly_upkeep_cost INTEGER NOT NULL DEFAULT 1000 CHECK (weekly_upkeep_cost >= 0),
    total_invested INTEGER NOT NULL DEFAULT 0 CHECK (total_invested >= 0),
    
    -- Benefits (Passive bonuses for controlling guild)
    bonus_xp_percent INTEGER NOT NULL DEFAULT 10 CHECK (bonus_xp_percent >= 0),
    bonus_gold_percent INTEGER NOT NULL DEFAULT 5 CHECK (bonus_gold_percent >= 0),
    
    -- Timing
    controlled_since TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_upkeep_paid TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    UNIQUE (manga_id) -- Only one guild can control a territory
);

-- Mercenary Listings
CREATE TABLE mercenary_listings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Pricing
    min_price_per_day INTEGER NOT NULL CHECK (min_price_per_day > 0),
    
    -- Status
    status mercenary_status NOT NULL DEFAULT 'available',
    hired_by_guild_id UUID REFERENCES guilds(id) ON DELETE SET NULL,
    hired_until TIMESTAMPTZ,
    
    -- Stats (For display)
    total_contracts INTEGER NOT NULL DEFAULT 0,
    total_earnings BIGINT NOT NULL DEFAULT 0,
    
    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- War Room Orders (Strategic Directives)
CREATE TABLE war_room_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    guild_id UUID NOT NULL REFERENCES guilds(id) ON DELETE CASCADE,
    
    -- Target
    target_type TEXT NOT NULL, -- 'manga', 'guild', 'raid', 'contract'
    target_id UUID NOT NULL,
    
    -- Priority & Details
    priority war_priority NOT NULL DEFAULT 'medium',
    title TEXT NOT NULL,
    description TEXT,
    
    -- Tracking
    is_completed BOOLEAN NOT NULL DEFAULT false,
    completed_at TIMESTAMPTZ,
    
    -- Creator
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- War History Log
CREATE TABLE war_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    guild_id_a UUID NOT NULL REFERENCES guilds(id) ON DELETE CASCADE,
    guild_id_b UUID NOT NULL REFERENCES guilds(id) ON DELETE CASCADE,
    
    -- War Details
    declared_by UUID REFERENCES guilds(id) ON DELETE SET NULL,
    war_score_a INTEGER NOT NULL DEFAULT 0,
    war_score_b INTEGER NOT NULL DEFAULT 0,
    
    -- Outcome
    winner_guild_id UUID REFERENCES guilds(id) ON DELETE SET NULL,
    
    -- Timing
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    
    -- Constraints
    CONSTRAINT no_self_war CHECK (guild_id_a != guild_id_b)
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX idx_territory_control_manga ON territory_control(manga_id);
CREATE INDEX idx_territory_control_guild ON territory_control(guild_id);
CREATE INDEX idx_mercenary_listings_status ON mercenary_listings(status);
CREATE INDEX idx_mercenary_listings_hired_by ON mercenary_listings(hired_by_guild_id) WHERE hired_by_guild_id IS NOT NULL;
CREATE INDEX idx_war_room_orders_guild ON war_room_orders(guild_id);
CREATE INDEX idx_war_room_orders_priority ON war_room_orders(priority);
CREATE INDEX idx_war_room_orders_completed ON war_room_orders(is_completed);
CREATE INDEX idx_war_history_guilds ON war_history(guild_id_a, guild_id_b);

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Calculate war score contribution
CREATE OR REPLACE FUNCTION calculate_war_score_contribution(
    p_guild_id UUID,
    p_action_type TEXT,
    p_value INTEGER
)
RETURNS INTEGER AS $$
BEGIN
    RETURN CASE p_action_type
        WHEN 'territory_captured' THEN 100
        WHEN 'raid_completed' THEN 50
        WHEN 'member_recruited' THEN 10
        WHEN 'contract_completed' THEN 75
        ELSE 0
    END * p_value;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =====================================================
-- CORE PvP FUNCTIONS
-- =====================================================

-- Declare war between guilds
CREATE OR REPLACE FUNCTION declare_war(
    p_guild_id_a UUID,
    p_guild_id_b UUID,
    p_acting_user_id UUID
)
RETURNS VOID AS $$
DECLARE
    v_existing_status guild_relation_status;
BEGIN
    -- Check permissions (leader only)
    IF NOT has_guild_permission(p_acting_user_id, p_guild_id_a, 'leader') THEN
        RAISE EXCEPTION 'Only guild leader can declare war';
    END IF;
    
    -- Cannot declare war on self
    IF p_guild_id_a = p_guild_id_b THEN
        RAISE EXCEPTION 'Cannot declare war on your own guild';
    END IF;
    
    -- Check existing relation
    SELECT status INTO v_existing_status
    FROM guild_relations
    WHERE (guild_id_a = LEAST(p_guild_id_a, p_guild_id_b) AND guild_id_b = GREATEST(p_guild_id_a, p_guild_id_b));
    
    IF v_existing_status = 'war' THEN
        RAISE EXCEPTION 'Already at war with this guild';
    END IF;
    
    IF v_existing_status = 'ally' THEN
        RAISE EXCEPTION 'Cannot declare war on an ally (break alliance first)';
    END IF;
    
    -- Create or update relation
    INSERT INTO guild_relations (guild_id_a, guild_id_b, status)
    VALUES (LEAST(p_guild_id_a, p_guild_id_b), GREATEST(p_guild_id_a, p_guild_id_b), 'war')
    ON CONFLICT (guild_id_a, guild_id_b)
    DO UPDATE SET
        status = 'war',
        war_score_a = 0,
        war_score_b = 0,
        updated_at = NOW();
    
    -- Log war history
    INSERT INTO war_history (guild_id_a, guild_id_b, declared_by)
    VALUES (p_guild_id_a, p_guild_id_b, p_guild_id_a);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- End war
CREATE OR REPLACE FUNCTION end_war(
    p_guild_id_a UUID,
    p_guild_id_b UUID,
    p_acting_user_id UUID
)
RETURNS VOID AS $$
DECLARE
    v_war_score_a INTEGER;
    v_war_score_b INTEGER;
    v_winner_id UUID;
BEGIN
    -- Check permissions (leader only)
    IF NOT has_guild_permission(p_acting_user_id, p_guild_id_a, 'leader') THEN
        RAISE EXCEPTION 'Only guild leader can end war';
    END IF;
    
    -- Get war scores
    SELECT war_score_a, war_score_b INTO v_war_score_a, v_war_score_b
    FROM guild_relations
    WHERE guild_id_a = LEAST(p_guild_id_a, p_guild_id_b)
    AND guild_id_b = GREATEST(p_guild_id_a, p_guild_id_b)
    AND status = 'war';
    
    IF v_war_score_a IS NULL THEN
        RAISE EXCEPTION 'No active war found';
    END IF;
    
    -- Determine winner
    IF v_war_score_a > v_war_score_b THEN
        v_winner_id := LEAST(p_guild_id_a, p_guild_id_b);
    ELSIF v_war_score_b > v_war_score_a THEN
        v_winner_id := GREATEST(p_guild_id_a, p_guild_id_b);
    ELSE
        v_winner_id := NULL; -- Draw
    END IF;
    
    -- Update relation to neutral
    UPDATE guild_relations
    SET
        status = 'neutral',
        updated_at = NOW()
    WHERE guild_id_a = LEAST(p_guild_id_a, p_guild_id_b)
    AND guild_id_b = GREATEST(p_guild_id_a, p_guild_id_b);
    
    -- Update war history
    UPDATE war_history
    SET
        winner_guild_id = v_winner_id,
        war_score_a = v_war_score_a,
        war_score_b = v_war_score_b,
        ended_at = NOW()
    WHERE guild_id_a = p_guild_id_a
    AND guild_id_b = p_guild_id_b
    AND ended_at IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Claim territory (manga patronage)
CREATE OR REPLACE FUNCTION claim_territory(
    p_guild_id UUID,
    p_manga_id UUID,
    p_acting_user_id UUID
)
RETURNS UUID AS $$
DECLARE
    v_territory_id UUID;
    v_existing_owner UUID;
    v_claim_cost INTEGER;
    v_treasury_gold BIGINT;
BEGIN
    -- Check permissions (officer+)
    IF NOT has_guild_permission(p_acting_user_id, p_guild_id, 'officer') THEN
        RAISE EXCEPTION 'Only officers and leaders can claim territories';
    END IF;
    
    -- Check if territory is already controlled
    SELECT guild_id INTO v_existing_owner
    FROM territory_control
    WHERE manga_id = p_manga_id;
    
    IF v_existing_owner IS NOT NULL THEN
        IF v_existing_owner = p_guild_id THEN
            RAISE EXCEPTION 'Your guild already controls this territory';
        ELSE
            RAISE EXCEPTION 'Territory is already controlled by another guild';
        END IF;
    END IF;
    
    -- Calculate claim cost (base 10,000 gold)
    v_claim_cost := 10000;
    
    -- Check treasury
    SELECT treasury_gold INTO v_treasury_gold FROM guilds WHERE id = p_guild_id;
    
    IF v_treasury_gold < v_claim_cost THEN
        RAISE EXCEPTION 'Insufficient guild treasury (need % gold)', v_claim_cost;
    END IF;
    
    -- Deduct cost
    UPDATE guilds
    SET treasury_gold = treasury_gold - v_claim_cost
    WHERE id = p_guild_id;
    
    -- Claim territory
    INSERT INTO territory_control (manga_id, guild_id, total_invested)
    VALUES (p_manga_id, p_guild_id, v_claim_cost)
    RETURNING id INTO v_territory_id;
    
    -- Log transaction
    INSERT INTO guild_transactions (guild_id, transaction_type, amount_gold, user_id, description, metadata)
    VALUES (p_guild_id, 'territory_claim', -v_claim_cost, p_acting_user_id,
            'Claimed territory',
            jsonb_build_object('manga_id', p_manga_id, 'territory_id', v_territory_id));
    
    RETURN v_territory_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Release territory
CREATE OR REPLACE FUNCTION release_territory(
    p_guild_id UUID,
    p_manga_id UUID,
    p_acting_user_id UUID
)
RETURNS VOID AS $$
BEGIN
    -- Check permissions (leader only)
    IF NOT has_guild_permission(p_acting_user_id, p_guild_id, 'leader') THEN
        RAISE EXCEPTION 'Only guild leader can release territories';
    END IF;
    
    -- Check ownership
    IF NOT EXISTS (
        SELECT 1 FROM territory_control
        WHERE manga_id = p_manga_id AND guild_id = p_guild_id
    ) THEN
        RAISE EXCEPTION 'Guild does not control this territory';
    END IF;
    
    -- Release territory
    DELETE FROM territory_control
    WHERE manga_id = p_manga_id AND guild_id = p_guild_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Hire mercenary
CREATE OR REPLACE FUNCTION hire_mercenary(
    p_guild_id UUID,
    p_user_id UUID,
    p_duration_days INTEGER,
    p_acting_user_id UUID
)
RETURNS VOID AS $$
DECLARE
    v_listing mercenary_listings%ROWTYPE;
    v_total_cost INTEGER;
    v_treasury_gold BIGINT;
BEGIN
    -- Check permissions (officer+)
    IF NOT has_guild_permission(p_acting_user_id, p_guild_id, 'officer') THEN
        RAISE EXCEPTION 'Only officers and leaders can hire mercenaries';
    END IF;
    
    -- Get mercenary listing
    SELECT * INTO v_listing FROM mercenary_listings WHERE user_id = p_user_id;
    
    IF v_listing.id IS NULL THEN
        RAISE EXCEPTION 'Mercenary listing not found';
    END IF;
    
    IF v_listing.status != 'available' THEN
        RAISE EXCEPTION 'Mercenary is not available';
    END IF;
    
    -- Calculate cost
    v_total_cost := v_listing.min_price_per_day * p_duration_days;
    
    -- Check treasury
    SELECT treasury_gold INTO v_treasury_gold FROM guilds WHERE id = p_guild_id;
    
    IF v_treasury_gold < v_total_cost THEN
        RAISE EXCEPTION 'Insufficient guild treasury (need % gold)', v_total_cost;
    END IF;
    
    -- Deduct cost from guild
    UPDATE guilds
    SET treasury_gold = treasury_gold - v_total_cost
    WHERE id = p_guild_id;
    
    -- Pay mercenary
    UPDATE profiles
    SET gold = gold + v_total_cost
    WHERE id = p_user_id;
    
    -- Update listing
    UPDATE mercenary_listings
    SET
        status = 'hired',
        hired_by_guild_id = p_guild_id,
        hired_until = NOW() + (p_duration_days || ' days')::INTERVAL,
        total_contracts = total_contracts + 1,
        total_earnings = total_earnings + v_total_cost,
        updated_at = NOW()
    WHERE user_id = p_user_id;
    
    -- Log transaction
    INSERT INTO guild_transactions (guild_id, transaction_type, amount_gold, user_id, description, metadata)
    VALUES (p_guild_id, 'mercenary_hire', -v_total_cost, p_acting_user_id,
            format('Hired mercenary for %s days', p_duration_days),
            jsonb_build_object('mercenary_id', p_user_id, 'duration_days', p_duration_days, 'cost', v_total_cost));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create war room order
CREATE OR REPLACE FUNCTION create_war_order(
    p_guild_id UUID,
    p_target_type TEXT,
    p_target_id UUID,
    p_priority war_priority,
    p_title TEXT,
    p_description TEXT,
    p_acting_user_id UUID
)
RETURNS UUID AS $$
DECLARE
    v_order_id UUID;
BEGIN
    -- Check permissions (officer+)
    IF NOT has_guild_permission(p_acting_user_id, p_guild_id, 'officer') THEN
        RAISE EXCEPTION 'Only officers and leaders can create war room orders';
    END IF;
    
    -- Create order
    INSERT INTO war_room_orders (guild_id, target_type, target_id, priority, title, description, created_by)
    VALUES (p_guild_id, p_target_type, p_target_id, p_priority, p_title, p_description, p_acting_user_id)
    RETURNING id INTO v_order_id;
    
    RETURN v_order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Complete war room order
CREATE OR REPLACE FUNCTION complete_war_order(
    p_order_id UUID,
    p_acting_user_id UUID
)
RETURNS VOID AS $$
DECLARE
    v_guild_id UUID;
BEGIN
    -- Get guild from order
    SELECT guild_id INTO v_guild_id FROM war_room_orders WHERE id = p_order_id;
    
    IF v_guild_id IS NULL THEN
        RAISE EXCEPTION 'Order not found';
    END IF;
    
    -- Check permissions (officer+)
    IF NOT has_guild_permission(p_acting_user_id, v_guild_id, 'officer') THEN
        RAISE EXCEPTION 'Only officers and leaders can complete orders';
    END IF;
    
    -- Mark as completed
    UPDATE war_room_orders
    SET
        is_completed = true,
        completed_at = NOW(),
        updated_at = NOW()
    WHERE id = p_order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- CRON JOBS
-- =====================================================

-- Process weekly territory upkeep (run weekly)
CREATE OR REPLACE FUNCTION territory_upkeep_cron()
RETURNS VOID AS $$
DECLARE
    v_territory RECORD;
    v_treasury_gold BIGINT;
BEGIN
    FOR v_territory IN
        SELECT * FROM territory_control
        WHERE last_upkeep_paid < NOW() - INTERVAL '7 days'
    LOOP
        -- Check guild treasury
        SELECT treasury_gold INTO v_treasury_gold
        FROM guilds WHERE id = v_territory.guild_id;
        
        IF v_treasury_gold >= v_territory.weekly_upkeep_cost THEN
            -- Deduct upkeep
            UPDATE guilds
            SET treasury_gold = treasury_gold - v_territory.weekly_upkeep_cost
            WHERE id = v_territory.guild_id;
            
            -- Update last payment
            UPDATE territory_control
            SET
                last_upkeep_paid = NOW(),
                total_invested = total_invested + v_territory.weekly_upkeep_cost
            WHERE id = v_territory.id;
            
            -- Log transaction
            INSERT INTO guild_transactions (guild_id, transaction_type, amount_gold, description, metadata)
            VALUES (v_territory.guild_id, 'territory_upkeep', -v_territory.weekly_upkeep_cost,
                    'Weekly territory upkeep',
                    jsonb_build_object('territory_id', v_territory.id, 'manga_id', v_territory.manga_id));
        ELSE
            -- Cannot afford upkeep - lose territory
            DELETE FROM territory_control WHERE id = v_territory.id;
            
            -- Log transaction
            INSERT INTO guild_transactions (guild_id, transaction_type, amount_gold, description, metadata)
            VALUES (v_territory.guild_id, 'territory_lost', 0,
                    'Lost territory due to insufficient upkeep',
                    jsonb_build_object('territory_id', v_territory.id, 'manga_id', v_territory.manga_id));
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Expire mercenary contracts (run daily)
CREATE OR REPLACE FUNCTION expire_mercenaries_cron()
RETURNS VOID AS $$
BEGIN
    UPDATE mercenary_listings
    SET
        status = 'available',
        hired_by_guild_id = NULL,
        hired_until = NULL,
        updated_at = NOW()
    WHERE status = 'hired'
    AND hired_until < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- TRIGGERS
-- =====================================================

CREATE OR REPLACE FUNCTION update_mercenary_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_mercenary_listings_updated_at
    BEFORE UPDATE ON mercenary_listings
    FOR EACH ROW
    EXECUTE FUNCTION update_mercenary_timestamp();

CREATE OR REPLACE FUNCTION update_war_order_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_war_room_orders_updated_at
    BEFORE UPDATE ON war_room_orders
    FOR EACH ROW
    EXECUTE FUNCTION update_war_order_timestamp();

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE territory_control IS 'Guild control over manga territories (patronage system)';
COMMENT ON TABLE mercenary_listings IS 'Players available for hire by guilds';
COMMENT ON TABLE war_room_orders IS 'Strategic directives and objectives set by guild leadership';
COMMENT ON TABLE war_history IS 'Historical record of guild wars and outcomes';
COMMENT ON FUNCTION declare_war IS 'Declare war on another guild (leader only)';
COMMENT ON FUNCTION claim_territory IS 'Claim control over a manga territory (costs gold)';
COMMENT ON FUNCTION hire_mercenary IS 'Hire a mercenary for a specified duration';
COMMENT ON FUNCTION territory_upkeep_cron IS 'Weekly cron to process territory upkeep costs';
