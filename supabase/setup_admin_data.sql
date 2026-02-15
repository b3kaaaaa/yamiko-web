-- [setup_admin_data.sql]
-- Run this in your Supabase SQL Editor to populate/refresh the Admin Panel data

-- 1. Refresh Popularity Stats (For Analytics Page)
-- This updates the materialized view used by the 'get_popular_feed' RPC
SELECT refresh_manga_popularity();

-- 2. Seed Initial Audit Logs (For Dashboard Activity & Logs Page)
-- This helps verify that the logs are correctly connected to the UI
DO $$
DECLARE
    admin_id UUID;
BEGIN
    -- Get the first admin available
    SELECT id INTO admin_id FROM public.profiles 
    WHERE role IN ('ADMIN', 'SUPER_ADMIN') 
    LIMIT 1;

    IF admin_id IS NOT NULL THEN
        -- Insert a few test logs if table is empty
        IF (SELECT COUNT(*) FROM public.admin_audit_logs) = 0 THEN
            INSERT INTO public.admin_audit_logs (admin_id, action_type, target_type, target_id, details)
            VALUES 
            (admin_id, 'system_check', 'system', 'global', '{"status": "initialized", "message": "Admin Panel Overhaul Sync"}'),
            (admin_id, 'update_config', 'system', 'game_config', '{"change": "revised exp rates", "value": 1.2}'),
            (admin_id, 'login', 'admin', admin_id::text, '{"ip": "127.0.0.1", "action": "Access Dashboard"}');
        END IF;
    END IF;
END $$;

-- 3. Verify Table Contents (Optional)
-- SELECT count(*) FROM public.profiles;
-- SELECT count(*) FROM public.admin_audit_logs;
-- SELECT count(*) FROM public.manga;
