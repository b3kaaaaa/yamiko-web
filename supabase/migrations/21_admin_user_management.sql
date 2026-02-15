-- Migration: 21_admin_user_management.sql
-- Description: RPC for Admins to update User Profiles (God Mode)

-- 1. Ensure columns exist (Fixing missing gold column and potentially ensure others)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS gold BIGINT DEFAULT 0;

-- 2. Create/Replace the Admin Update Function
CREATE OR REPLACE FUNCTION admin_update_profile(
    p_target_user_id UUID,
    p_username TEXT,
    p_level INTEGER,
    p_xp BIGINT,
    p_rubies BIGINT,
    p_gold BIGINT,
    p_energy INTEGER,
    p_role TEXT, -- Changed from user_role enum to TEXT to match table definition
    p_is_banned BOOLEAN,
    p_admin_id UUID DEFAULT auth.uid()
)
RETURNS VOID AS $$
BEGIN
    -- 1. Check if executor is Admin
    IF NOT is_admin(p_admin_id) THEN
        RAISE EXCEPTION 'Unauthorized: Caller is not an admin';
    END IF;

    -- 2. Update Profile
    UPDATE profiles
    SET
        username = p_username,
        level = p_level,
        xp = p_xp,   -- Correct column name is 'xp', not 'exp'
        rubies = p_rubies,
        gold = p_gold,
        energy = p_energy,
        role = p_role,
        is_banned = p_is_banned,
        updated_at = NOW()
    WHERE id = p_target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Grant Permissions
GRANT EXECUTE ON FUNCTION admin_update_profile(UUID, TEXT, INTEGER, BIGINT, BIGINT, BIGINT, INTEGER, TEXT, BOOLEAN, UUID) TO postgres, authenticated, service_role;
