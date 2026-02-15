-- Migration: 16_fix_permissions.sql
-- Description: Grant execute permissions on public RPC functions (needed if default is restrictive or for explicit clarity)

-- 1. Public List RPC
GRANT EXECUTE ON FUNCTION get_public_guilds(JSONB, TEXT, INTEGER, INTEGER) TO postgres, anon, authenticated, service_role;

-- 2. Single Guild RPC
GRANT EXECUTE ON FUNCTION get_full_guild_data(UUID, UUID) TO postgres, anon, authenticated, service_role;

-- 3. Manga Territory RPC
GRANT EXECUTE ON FUNCTION get_manga_territory(TEXT) TO postgres, anon, authenticated, service_role;

-- 4. Join Request
GRANT EXECUTE ON FUNCTION request_join_guild(UUID, TEXT, UUID) TO postgres, authenticated, service_role;

-- 5. Create Guild
GRANT EXECUTE ON FUNCTION create_guild(TEXT, TEXT, TEXT, TEXT, TEXT, UUID) TO postgres, authenticated, service_role;

-- 6. Member Actions
GRANT EXECUTE ON FUNCTION leave_guild(UUID) TO postgres, authenticated, service_role;
GRANT EXECUTE ON FUNCTION donate_to_treasury(UUID, BIGINT, TEXT, UUID) TO postgres, authenticated, service_role;

-- 7. Ensure Admin functions are NOT granted to anon/authenticated (they have internal checks, but good to restrict)
-- REVOKE EXECUTE ON FUNCTION admin_edit_guild FROM anon, authenticated;\
-- (Already restricted by logic, but explicit revoke is safer if we want to be strict. For now, rely on internal is_admin check as configured)
