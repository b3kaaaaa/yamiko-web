-- Admin Panel Migration

-- 1. Add Role to Profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'USER' CHECK (role IN ('USER', 'MODERATOR', 'ADMIN'));

-- Create Index for performance on role checks
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- 2. Admin Policies for Quest Definitions (Access to Write)
-- Note: 'quest_definitions' RLS was enabled in 05_quests_system.sql
-- We need to ensure policies exist.

DROP POLICY IF EXISTS "Admins can manage quests" ON quest_definitions;
CREATE POLICY "Admins can manage quests" ON quest_definitions
FOR ALL
USING (
  auth.uid() IN (SELECT id FROM profiles WHERE role = 'ADMIN')
);

-- 3. Admin Policies for User Management
-- Allow admins to see everything in profiles? (Already allow SELECT true)
-- Allow admins to update roles (and other fields)
DROP POLICY IF EXISTS "Admins can update profiles" ON profiles;
CREATE POLICY "Admins can update profiles" ON profiles
FOR UPDATE
USING (
  auth.uid() IN (SELECT id FROM profiles WHERE role = 'ADMIN')
);

-- 4. Helper to promote user (Dev only, but useful)
CREATE OR REPLACE FUNCTION promote_to_admin(target_email TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE profiles
    SET role = 'ADMIN'
    WHERE id = (SELECT id FROM auth.users WHERE email = target_email);
END;
$$;
