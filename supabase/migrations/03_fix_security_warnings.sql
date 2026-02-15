-- Security Fixes for "Function Search Path Mutable" Warnings
-- Run this in Supabase SQL Editor

-- 1. Fix get_shadow_army_count
ALTER FUNCTION public.get_shadow_army_count(UUID) SET search_path = public;

-- 2. Fix handle_new_user_settings
-- Trigger functions have no arguments in signature
ALTER FUNCTION public.handle_new_user_settings() SET search_path = public;

-- 3. Fix send_gift
-- Signature: receiver_uuid UUID, g_type TEXT, content_value TEXT, gift_message TEXT
ALTER FUNCTION public.send_gift(UUID, TEXT, TEXT, TEXT) SET search_path = public;

-- 4. Fix add_exp (Dynamic lookup to handle unknown signature)
DO $$
DECLARE
    func_sig text;
BEGIN
    -- Find the function signature for 'add_exp' in the public schema
    SELECT format('public.add_exp(%s)', pg_get_function_identity_arguments(oid))
    INTO func_sig
    FROM pg_proc
    WHERE proname = 'add_exp'
    AND pronamespace = 'public'::regnamespace;

    -- If found, execute the ALTER command
    IF func_sig IS NOT NULL THEN
        EXECUTE 'ALTER FUNCTION ' || func_sig || ' SET search_path = public;';
        RAISE NOTICE 'Fixed search_path for %', func_sig;
    ELSE
        RAISE NOTICE 'Function public.add_exp not found, skipping.';
    END IF;
END $$;
