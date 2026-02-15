-- Migration: 41_security_functions_fix.sql
-- Description: Hardening all public functions by setting fixed search_path

DO $$
DECLARE
    func_name text;
    func_args text;
    v_schema text := 'public';
BEGIN
    -- Loop through all functions in the public schema
    FOR func_name, func_args IN 
        SELECT p.proname, pg_get_function_identity_arguments(p.oid)
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = v_schema
    LOOP
        -- Apply fixed search_path to prevent search_path hijacking
        BEGIN
            EXECUTE format('ALTER FUNCTION public.%I(%s) SET search_path = public, extensions', func_name, func_args);
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Could not alter function % (%): %', func_name, func_args, SQLERRM;
        END;
    END LOOP;
END $$;
