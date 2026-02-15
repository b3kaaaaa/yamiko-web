-- Migration: 42_security_infrastructure_fix.sql
-- Description: Fix Security Definer views, isolate extensions, and restrict API access

-- 1. View Security: Change to SECURITY INVOKER
-- Views in Postgres are security invoker by default, but if they were created with specific properties 
-- or inside a SECURITY DEFINER function context, they might inherit risks.
-- For admin_guild_audit_log, we want to ensure it respects the querying user's RLS.
ALTER VIEW public.admin_guild_audit_log SET (security_invoker = on);

-- 2. Extension Isolation
-- Move extensions from public to extensions schema
CREATE SCHEMA IF NOT EXISTS extensions;
ALTER EXTENSION pg_trgm SET SCHEMA extensions;

-- 3. API Visibility: Restrict Materialized View
-- Materilaized views don't support RLS, so we must control access via GRANT/REVOKE.
REVOKE ALL ON public.manga_popularity_stats FROM anon, authenticated;
-- Allow only service_role (backend) to access it if needed, or keep it for internal use only.
-- If the frontend needs it, it should go through an RPC function which can be secured.
