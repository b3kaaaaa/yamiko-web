-- Performance Optimization Migration
-- Adds indexes to frequently queried columns to speed up Admin Panel and Global Widgets

-- Index for role-based queries (Admin Panel)
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- Index for online status (RightSidebar Widgets)
CREATE INDEX IF NOT EXISTS idx_profiles_is_online ON public.profiles(is_online);

-- Index for popular manga (RightSidebar & Home)
CREATE INDEX IF NOT EXISTS idx_manga_views ON public.manga(views DESC);

-- Index for search (Wiki & Catalog)
CREATE INDEX IF NOT EXISTS idx_manga_title_trgm ON public.manga USING gin (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_profiles_username_trgm ON public.profiles USING gin (username gin_trgm_ops);
