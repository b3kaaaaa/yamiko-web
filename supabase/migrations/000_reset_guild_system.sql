-- SUPER RESET SCRIPT: Run this to fix ALL guild errors ("already exists", "column missing", etc.)

-- 1. Detach profiles from guilds to unlock deletion
ALTER TABLE profiles DROP COLUMN IF EXISTS main_guild_id;

-- 2. Drop all guild tables (CASCADE removes dependencies automatically)
DROP TABLE IF EXISTS guilds CASCADE;
DROP TABLE IF EXISTS guild_members CASCADE;
DROP TABLE IF EXISTS guild_relations CASCADE;
DROP TABLE IF EXISTS guild_buildings CASCADE;
DROP TABLE IF EXISTS guild_warehouse CASCADE;
DROP TABLE IF EXISTS guild_buffs CASCADE;
DROP TABLE IF EXISTS guild_forge CASCADE;
DROP TABLE IF EXISTS guild_transactions CASCADE;
DROP TABLE IF EXISTS boss_definitions CASCADE;
DROP TABLE IF EXISTS guild_raids CASCADE;
DROP TABLE IF EXISTS raid_logs CASCADE;
DROP TABLE IF EXISTS guild_contracts CASCADE;
DROP TABLE IF EXISTS raid_loot CASCADE;
DROP TABLE IF EXISTS territory_control CASCADE;
DROP TABLE IF EXISTS mercenary_listings CASCADE;
DROP TABLE IF EXISTS war_room_orders CASCADE;
DROP TABLE IF EXISTS war_history CASCADE;

-- 3. Drop Custom Types to clear enum errors
DROP TYPE IF EXISTS guild_role CASCADE;
DROP TYPE IF EXISTS guild_relation_status CASCADE;
DROP TYPE IF EXISTS guild_theme CASCADE;
DROP TYPE IF EXISTS building_type CASCADE;
DROP TYPE IF EXISTS buff_type CASCADE;
DROP TYPE IF EXISTS raid_status CASCADE;
DROP TYPE IF EXISTS boss_tier CASCADE;
DROP TYPE IF EXISTS war_priority CASCADE;
DROP TYPE IF EXISTS mercenary_status CASCADE;

-- 4. FIX PROFILES ROLE (The source of your RLS errors)
DROP POLICY IF EXISTS "Admins can update profiles" ON profiles;

DO $$ 
BEGIN
    -- Ensure role column exists
    IF NOT EXISTS (SELECT 1 FROM pg_attribute WHERE attrelid = 'profiles'::regclass AND attname = 'role') THEN
        ALTER TABLE profiles ADD COLUMN role TEXT DEFAULT 'USER';
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- 5. Final Policy Cleanup
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'moderation_logs') THEN
        DROP POLICY IF EXISTS "Admins can view and create logs" ON moderation_logs;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'boss_definitions') THEN
        DROP POLICY IF EXISTS "Admins can manage boss definitions" ON boss_definitions;
    END IF;
END $$;

DO $$ 
BEGIN 
    RAISE NOTICE 'System Reset Complete. You can now run migrations 08 -> 09 -> 10 -> ... cleanly.';
END $$;
