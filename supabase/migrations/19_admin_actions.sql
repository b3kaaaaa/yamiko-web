-- Migration: 19_admin_actions.sql
-- Description: Admin actions for Guild editing and Raid management

-- 1. Seed Boss Definitions (if empty)
INSERT INTO boss_definitions (name, description, tier, base_hp, hp_scaling_per_level, guaranteed_gold, guaranteed_xp, min_guild_level, avatar_url)
SELECT 'Ancient Dragon', 'A massive dragon breathing fire.', 'legendary', 1000000, 50000, 5000, 2000, 10, '/images/bosses/dragon.png'
WHERE NOT EXISTS (SELECT 1 FROM boss_definitions WHERE name = 'Ancient Dragon');

INSERT INTO boss_definitions (name, description, tier, base_hp, hp_scaling_per_level, guaranteed_gold, guaranteed_xp, min_guild_level, avatar_url)
SELECT 'Shadow Demon', 'A demon from the abyss.', 'epic', 500000, 25000, 2500, 1000, 5, '/images/bosses/demon.png'
WHERE NOT EXISTS (SELECT 1 FROM boss_definitions WHERE name = 'Shadow Demon');

INSERT INTO boss_definitions (name, description, tier, base_hp, hp_scaling_per_level, guaranteed_gold, guaranteed_xp, min_guild_level, avatar_url)
SELECT 'Goblin King', 'Leader of the goblin horde.', 'common', 50000, 2000, 500, 200, 1, '/images/bosses/goblin.png'
WHERE NOT EXISTS (SELECT 1 FROM boss_definitions WHERE name = 'Goblin King');


-- 2. Admin Update Guild
CREATE OR REPLACE FUNCTION admin_update_guild(
    p_guild_id UUID,
    p_name TEXT,
    p_tag TEXT,
    p_level INTEGER,
    p_treasury_gold BIGINT,
    p_treasury_rubies BIGINT,
    p_is_recruiting BOOLEAN,
    p_admin_id UUID DEFAULT auth.uid()
)
RETURNS VOID AS $$
BEGIN
    -- Check admin
    IF NOT is_admin(p_admin_id) THEN
        RAISE EXCEPTION 'Unauthorized';
    END IF;

    -- Update
    UPDATE guilds
    SET
        name = p_name,
        tag = p_tag,
        level = p_level,
        treasury_gold = p_treasury_gold,
        treasury_rubies = p_treasury_rubies,
        is_recruiting = p_is_recruiting,
        updated_at = NOW()
    WHERE id = p_guild_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 3. Admin Force Start Raid
CREATE OR REPLACE FUNCTION admin_force_start_raid(
    p_guild_id UUID,
    p_boss_id UUID,
    p_admin_id UUID DEFAULT auth.uid()
)
RETURNS UUID AS $$
DECLARE
    v_raid_id UUID;
    v_boss boss_definitions%ROWTYPE;
    v_guild_level INTEGER;
    v_max_hp BIGINT;
    v_duration_hours INTEGER;
BEGIN
    -- Check admin
    IF NOT is_admin(p_admin_id) THEN
        RAISE EXCEPTION 'Unauthorized';
    END IF;

    -- Check active raid (Admin can override, but let's clear it first if exists? Or fail?)
    -- Let's just fail nicely
    IF EXISTS (SELECT 1 FROM guild_raids WHERE guild_id = p_guild_id AND status = 'active') THEN
        RAISE EXCEPTION 'Guild already has an active raid. Cancel it first.';
    END IF;

    -- Get boss
    SELECT * INTO v_boss FROM boss_definitions WHERE id = p_boss_id;
    
    -- Get guild level
    SELECT level INTO v_guild_level FROM guilds WHERE id = p_guild_id;

    -- Calculate stats (same logic as start_raid but skipping entry requirements)
    v_max_hp := v_boss.base_hp + (v_guild_level * v_boss.hp_scaling_per_level);
     v_duration_hours := CASE v_boss.tier
        WHEN 'common' THEN 24
        WHEN 'rare' THEN 48
        WHEN 'epic' THEN 72
        WHEN 'legendary' THEN 96
        WHEN 'mythic' THEN 120
    END;

    INSERT INTO guild_raids (guild_id, boss_id, current_hp, max_hp, ends_at)
    VALUES (p_guild_id, p_boss_id, v_max_hp, v_max_hp, NOW() + (v_duration_hours || ' hours')::INTERVAL)
    RETURNING id INTO v_raid_id;

    RETURN v_raid_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Get Bosses (Admin/Public)
CREATE OR REPLACE FUNCTION get_boss_definitions()
RETURNS SETOF boss_definitions AS $$
    SELECT * FROM boss_definitions ORDER BY min_guild_level ASC;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Grants
GRANT EXECUTE ON FUNCTION admin_update_guild(UUID, TEXT, TEXT, INTEGER, BIGINT, BIGINT, BOOLEAN, UUID) TO postgres, authenticated, service_role;
GRANT EXECUTE ON FUNCTION admin_force_start_raid(UUID, UUID, UUID) TO postgres, authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_boss_definitions() TO postgres, anon, authenticated, service_role;
