-- 36_wiki_system.sql

-- Enable required extensions (Supabase typically uses 'extensions' schema for these)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- A. Public Data (wiki_entities)
-- Drop types if they exist or create them safely
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'wiki_entity_type') THEN
        CREATE TYPE wiki_entity_type AS ENUM ('character', 'location', 'artifact', 'faction', 'world');
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS wiki_entities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    manga_id UUID REFERENCES manga(id) ON DELETE CASCADE,
    type wiki_entity_type NOT NULL,
    slug TEXT NOT NULL,
    title TEXT NOT NULL,
    cover_image TEXT,
    content JSONB DEFAULT '{}'::jsonb,
    attributes JSONB DEFAULT '{}'::jsonb,
    is_spoiler BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(manga_id, slug)
);

-- B. Moderation Queue (wiki_edits)
DO $$ BEGIN
    CREATE TYPE wiki_edit_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS wiki_edits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_id UUID REFERENCES wiki_entities(id) ON DELETE SET NULL, -- Null if creating new page
    manga_id UUID REFERENCES manga(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    type wiki_entity_type,
    title TEXT,
    slug TEXT,
    proposed_content JSONB,
    proposed_attributes JSONB,
    cover_image TEXT,
    status wiki_edit_status DEFAULT 'pending',
    admin_comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- C. Stats (wiki_stats)
CREATE TABLE IF NOT EXISTS wiki_stats (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    approved_edits_count INTEGER DEFAULT 0,
    last_edit_date TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_wiki_entities_manga ON wiki_entities(manga_id);
CREATE INDEX IF NOT EXISTS idx_wiki_entities_slug ON wiki_entities(slug);
CREATE INDEX IF NOT EXISTS idx_wiki_entities_title ON wiki_entities USING gin(title gin_trgm_ops); -- Requires pg_trgm extension enabled usually
CREATE INDEX IF NOT EXISTS idx_wiki_edits_status ON wiki_edits(status);

-- Enable RLS
ALTER TABLE wiki_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE wiki_edits ENABLE ROW LEVEL SECURITY;
ALTER TABLE wiki_stats ENABLE ROW LEVEL SECURITY;

-- Policies (Simplified for now)
CREATE POLICY "Public can view approved entities" ON wiki_entities FOR SELECT USING (true);
CREATE POLICY "Public can view own edits" ON wiki_edits FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can create edits" ON wiki_edits FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Public can view stats" ON wiki_stats FOR SELECT USING (true);

-- RPC: get_fandom_hub
CREATE OR REPLACE FUNCTION get_fandom_hub()
RETURNS JSON AS $$
DECLARE
    v_popular_worlds JSON;
    v_top_keepers JSON;
    v_recent_activity JSON;
BEGIN
    -- Popular Worlds (Manga with most wiki entities)
    -- If no entities, fallback to popular manga
    SELECT json_agg(t) INTO v_popular_worlds FROM (
        SELECT 
            m.id, m.title, m.cover_url, m.slug,
            COUNT(we.id) as entity_count,
            m.views
        FROM manga m
        LEFT JOIN wiki_entities we ON m.id = we.manga_id
        GROUP BY m.id
        ORDER BY entity_count DESC, m.views DESC
        LIMIT 4
    ) t;

    -- Top Keepers
    SELECT json_agg(t) INTO v_top_keepers FROM (
        SELECT 
            p.id, p.username, p.avatar_url, p.display_id,
            COALESCE(ws.approved_edits_count, 0) as approved_edits_count,
            ws.last_edit_date
        FROM profiles p
        LEFT JOIN wiki_stats ws ON p.id = ws.user_id
        ORDER BY approved_edits_count DESC NULLS LAST
        LIMIT 5
    ) t;

    -- Recent Activity (Approved edits)
    SELECT json_agg(t) INTO v_recent_activity FROM (
        SELECT 
            wed.id, 
            COALESCE(wed.title, we.title) as title,
            COALESCE(wed.type, we.type) as type,
            m.title as manga_title,
            m.slug as manga_slug,
            p.username, p.avatar_url,
            wed.created_at
        FROM wiki_edits wed
        LEFT JOIN wiki_entities we ON wed.entity_id = we.id
        JOIN manga m ON wed.manga_id = m.id
        JOIN profiles p ON wed.user_id = p.id
        WHERE wed.status = 'approved'
        ORDER BY wed.created_at DESC
        LIMIT 10
    ) t;

    RETURN json_build_object(
        'popular_worlds', COALESCE(v_popular_worlds, '[]'::json),
        'top_keepers', COALESCE(v_top_keepers, '[]'::json),
        'recent_activity', COALESCE(v_recent_activity, '[]'::json)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC: submit_draft
CREATE OR REPLACE FUNCTION submit_draft(
    p_manga_id UUID,
    p_type wiki_entity_type,
    p_title TEXT,
    p_content JSONB,
    p_attributes JSONB DEFAULT '{}'::jsonb,
    p_entity_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_edit_id UUID;
    v_slug TEXT;
BEGIN
    -- Generate slug from title if new
    v_slug := lower(regexp_replace(p_title, '[^a-zA-Z0-9]+', '-', 'g'));

    INSERT INTO wiki_edits (
        manga_id, entity_id, user_id, type, title, slug, proposed_content, proposed_attributes
    ) VALUES (
        p_manga_id, p_entity_id, auth.uid(), p_type, p_title, v_slug, p_content, p_attributes
    ) RETURNING id INTO v_edit_id;

    RETURN v_edit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC: search_wiki
CREATE OR REPLACE FUNCTION search_wiki(p_query TEXT)
RETURNS JSON AS $$
DECLARE
    v_results JSON;
BEGIN
    SELECT json_agg(t) INTO v_results FROM (
        SELECT 
            we.id, we.title, we.type, we.slug, we.cover_image,
            m.title as manga_title, m.slug as manga_slug
        FROM wiki_entities we
        JOIN manga m ON we.manga_id = m.id
        WHERE we.title ILIKE '%' || p_query || '%'
        LIMIT 10
    ) t;

    RETURN COALESCE(v_results, '[]'::json);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC: approve_edit (Admin)
CREATE OR REPLACE FUNCTION approve_edit(p_edit_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_edit RECORD;
    v_entity_id UUID;
BEGIN
    -- Check permissions (TODO: Real admin check)
    -- IF NOT is_admin() THEN RA ISE EXCEPTION 'Not authorized'; END IF;

    SELECT * INTO v_edit FROM wiki_edits WHERE id = p_edit_id;
    IF NOT FOUND THEN RETURN FALSE; END IF;

    IF v_edit.entity_id IS NULL THEN
        -- Create new entity
        INSERT INTO wiki_entities (
            manga_id, type, slug, title, content, attributes, cover_image
        ) VALUES (
            v_edit.manga_id, v_edit.type, v_edit.slug, v_edit.title, v_edit.proposed_content, v_edit.proposed_attributes, v_edit.cover_image
        ) RETURNING id INTO v_entity_id;
    ELSE
        -- Update existing
        UPDATE wiki_entities SET
            content = v_edit.proposed_content,
            attributes = v_edit.proposed_attributes,
            updated_at = NOW()
        WHERE id = v_edit.entity_id;
        v_entity_id := v_edit.entity_id;
    END IF;

    -- Update edit status
    UPDATE wiki_edits SET status = 'approved', entity_id = v_entity_id WHERE id = p_edit_id;

    -- Update stats
    INSERT INTO wiki_stats (user_id, approved_edits_count, last_edit_date)
    VALUES (v_edit.user_id, 1, NOW())
    ON CONFLICT (user_id) DO UPDATE SET
        approved_edits_count = wiki_stats.approved_edits_count + 1,
        last_edit_date = NOW();
    
    -- Grant XP (Assuming profiles table has exp)
    UPDATE profiles SET exp = exp + 50 WHERE id = v_edit.user_id;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
