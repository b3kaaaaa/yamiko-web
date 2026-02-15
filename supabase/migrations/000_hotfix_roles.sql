-- HOTFIX: Run this script BEFORE migration 08 to fix the "column role does not exist" error.

-- 1. Remove conflicting policies that reference the missing 'role' column
DROP POLICY IF EXISTS "Admins can update profiles" ON profiles;

DO $$ 
BEGIN
    -- Fix moderation_logs policy (check table first)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'moderation_logs') THEN
        DROP POLICY IF EXISTS "Admins can view and create logs" ON moderation_logs;
    END IF;
    
    -- Fix boss_definitions policy
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'boss_definitions') THEN
        DROP POLICY IF EXISTS "Admins can manage boss definitions" ON boss_definitions;
    END IF;
END $$;

-- 2. Create the missing 'role' column in profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'USER';
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- 3. Create the 'guild_role' enum if it doesn't exist (needed for functions)
DO $$ BEGIN
    CREATE TYPE guild_role AS ENUM ('leader', 'officer', 'veteran', 'member', 'recruit');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Validation message
DO $$ 
BEGIN 
    RAISE NOTICE 'Hotfix applied successfully. You can now run migration 08.';
END $$;
