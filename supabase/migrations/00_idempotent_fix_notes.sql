-- Quick fix script to make migrations 10-13 idempotent
-- Run this to add IF NOT EXISTS to all remaining guild migrations

-- This file documents the changes needed for migrations 10-13
-- Apply these patterns manually or via find-replace:

-- 1. ENUMS: Wrap in DO $$ blocks
-- Pattern: CREATE TYPE xyz AS ENUM (...)
-- Replace with:
/*
DO $$ BEGIN
    CREATE TYPE xyz AS ENUM (...);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
*/

-- 2. TABLES: Add IF NOT EXISTS
-- Pattern: CREATE TABLE xyz (
-- Replace with: CREATE TABLE IF NOT EXISTS xyz (

-- 3. INDEXES: Add IF NOT EXISTS
-- Pattern: CREATE INDEX idx_xyz
-- Replace with: CREATE INDEX IF NOT EXISTS idx_xyz

-- Files to fix:
-- - 10_guild_pve.sql
-- - 11_guild_pvp.sql
-- - 12_guild_social.sql
-- - 13_guild_rls.sql (RLS policies don't need IF NOT EXISTS)
