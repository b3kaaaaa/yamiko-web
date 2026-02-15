-- Migration: 33_fix_history_rpc.sql
-- Description: Re-applies get_user_history to ensure "number" column is quoted correctly.

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
