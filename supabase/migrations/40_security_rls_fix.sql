-- Migration: 40_security_rls_fix.sql
-- Description: Enable RLS and add basic policies for public tables

-- 1. Enable RLS
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spotlight_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reading_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manga_genres ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.genres ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guild_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manga_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.library_entries ENABLE ROW LEVEL SECURITY;

-- 2. General Public Read Policies (Genres, Tags, Posts)
CREATE POLICY "Public can view genres" ON public.genres FOR SELECT USING (true);
CREATE POLICY "Public can view tags" ON public.tags FOR SELECT USING (true);
CREATE POLICY "Public can view manga_genres" ON public.manga_genres FOR SELECT USING (true);
CREATE POLICY "Public can view manga_tags" ON public.manga_tags FOR SELECT USING (true);
CREATE POLICY "Public can view community_posts" ON public.community_posts FOR SELECT USING (true);

-- 3. Community Interactions Policies
CREATE POLICY "Authenticated can view interactions" ON public.community_interactions 
    FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can manage their own interactions" ON public.community_interactions 
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 4. Community Posts Ownership
CREATE POLICY "Users can manage their own posts" ON public.community_posts 
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 5. Spotlight Policies
CREATE POLICY "Public can view spotlight" ON public.spotlight_features FOR SELECT USING (true);
CREATE POLICY "Admins can manage spotlight" ON public.spotlight_features 
    FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (role = 'ADMIN' OR role = 'SUPER_ADMIN')));

-- 6. Reading Progress & Library
CREATE POLICY "Users can manage their own library" ON public.library_entries 
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can manage their own progress" ON public.reading_progress 
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 7. Guild Applications
CREATE POLICY "Users can manage their own applications" ON public.guild_applications 
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins/Leaders can view applications" ON public.guild_applications 
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles WHERE id = auth.uid() AND (role = 'ADMIN' OR role = 'SUPER_ADMIN')
        ) OR 
        EXISTS (
            SELECT 1 FROM guild_members 
            WHERE user_id = auth.uid() AND guild_id = guild_applications.guild_id AND role IN ('leader', 'officer')
        )
    );
