-- [38_admin_system.sql]
-- God Mode Backend Infrastructure

-- 1. Admin Audit Logs
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID NOT NULL REFERENCES public.profiles(id),
    action_type TEXT NOT NULL, -- e.g., 'ban_user', 'manage_resources', 'update_config'
    target_id TEXT, -- ID of the target (user_id, guild_id, etc.)
    target_type TEXT, -- type of target ('user', 'guild', 'system')
    details JSONB DEFAULT '{}'::jsonb,
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. System Settings (Live Ops)
CREATE TABLE IF NOT EXISTS public.system_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT now(),
    updated_by UUID REFERENCES public.profiles(id)
);

-- RLS for Audit Logs
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view audit logs" ON public.admin_audit_logs
    FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (role = 'ADMIN' OR role = 'SUPER_ADMIN')));

-- RLS for System Settings
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view settings" ON public.system_settings FOR SELECT USING (true);
CREATE POLICY "Admins can update settings" ON public.system_settings
    FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (role = 'ADMIN' OR role = 'SUPER_ADMIN')));

-- Seed Initial Configs
INSERT INTO public.system_settings (key, value, description) VALUES
('game_config', '{
    "base_exp_rate": 1.0,
    "ruby_drop_rate": 0.05,
    "energy_regen_speed": 300,
    "max_level": 100
}'::jsonb, 'Global game balanced parameters'),
('ui_config', '{
    "maintenance_mode": false,
    "promo_banner_active": true,
    "featured_manga_id": null
}'::jsonb, 'Frontend UI visibility settings')
ON CONFLICT (key) DO NOTHING;
