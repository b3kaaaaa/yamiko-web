-- Migration: 34_ensure_history_columns.sql
-- Description: Ensures "number" column exists in chapters and "total_pages" in reading_progress, then re-applies the fixed RPC.

-- 1. Ensure columns exist (handling cases where table was created without them)
ALTER TABLE chapters ADD COLUMN IF NOT EXISTS "number" NUMERIC(10, 2) DEFAULT 0;
ALTER TABLE chapters ADD COLUMN IF NOT EXISTS slug TEXT;
ALTER TABLE chapters ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE reading_progress ADD COLUMN IF NOT EXISTS total_pages INTEGER DEFAULT 1;

-- 2. Re-apply the fixed RPC function
CREATE OR REPLACE FUNCTION get_user_history(
    p_page INTEGER DEFAULT 1,
    p_limit INTEGER DEFAULT 20
)
RETURNS JSON AS $$
DECLARE
    v_offset INTEGER;
    v_total INTEGER;
    v_data JSON;
BEGIN
    v_offset := (p_page - 1) * p_limit;
    
    SELECT COUNT(*) INTO v_total 
    FROM reading_progress 
    WHERE user_id = auth.uid();

    SELECT json_agg(row_to_json(t)) INTO v_data
    FROM (
        SELECT 
            rp.manga_id,
            rp.chapter_id,
            rp.page_number,
            rp.total_pages,
            rp.is_completed,
            rp.updated_at,
            m.title as manga_title,
            m.cover_url as manga_cover,
            m.slug as manga_slug,
            c."number" as chapter_number, -- Quoted to handle potential reserved keyword
            c.title as chapter_title,
            c.slug as chapter_slug
        FROM reading_progress rp
        JOIN manga m ON rp.manga_id = m.id
        JOIN chapters c ON rp.chapter_id = c.id
        WHERE rp.user_id = auth.uid()
        ORDER BY rp.updated_at DESC
        LIMIT p_limit OFFSET v_offset
    ) t;

    RETURN json_build_object(
        'data', COALESCE(v_data, '[]'::json),
        'meta', json_build_object(
            'total', v_total,
            'page', p_page,
            'limit', p_limit
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
