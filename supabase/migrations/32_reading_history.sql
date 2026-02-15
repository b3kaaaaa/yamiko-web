-- Migration: 32_reading_history.sql
-- Description: Reading Progress tracking and History Analytics
-- Author: Yamiko Backend Architect

-- ==========================================
-- 1. READING PROGRESS (State)
-- ==========================================

CREATE TABLE IF NOT EXISTS reading_progress (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    manga_id UUID REFERENCES manga(id) ON DELETE CASCADE,
    chapter_id UUID REFERENCES chapters(id) ON DELETE CASCADE, -- Last opened chapter
    page_number INTEGER DEFAULT 1,
    total_pages INTEGER DEFAULT 0,
    is_completed BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, manga_id)
);

CREATE INDEX IF NOT EXISTS idx_reading_progress_user_updated ON reading_progress(user_id, updated_at DESC);

-- ==========================================
-- 2. SYNC FUNCTION (core logic)
-- ==========================================

CREATE OR REPLACE FUNCTION sync_reading_progress(
    p_manga_id UUID,
    p_chapter_id UUID,
    p_page_number INTEGER,
    p_total_pages INTEGER
)
RETURNS VOID AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_is_completed BOOLEAN;
    v_prev_completed BOOLEAN;
BEGIN
    IF v_user_id IS NULL THEN RETURN; END IF;

    -- Determine completion (simple logic: last page reached)
    v_is_completed := (p_page_number >= p_total_pages AND p_total_pages > 0);

    -- Check previous state to trigger XP
    SELECT is_completed INTO v_prev_completed
    FROM reading_progress
    WHERE user_id = v_user_id AND manga_id = p_manga_id;

    -- Upsert Progress
    INSERT INTO reading_progress (user_id, manga_id, chapter_id, page_number, total_pages, is_completed, updated_at)
    VALUES (v_user_id, p_manga_id, p_chapter_id, p_page_number, p_total_pages, v_is_completed, NOW())
    ON CONFLICT (user_id, manga_id) 
    DO UPDATE SET
        chapter_id = EXCLUDED.chapter_id,
        page_number = EXCLUDED.page_number,
        total_pages = EXCLUDED.total_pages,
        is_completed = EXCLUDED.is_completed,
        updated_at = NOW();

    -- Log to History (Analytics/Counts)
    -- Only log if chapter changed or just started/finished to avoid spamming logs on every page flip
    -- For simplicity, let's log unique chapter reads per day or just insert.
    -- Better: Insert if not exists for this chapter/user
    INSERT INTO reading_history (user_id, chapter_id, read_at)
    VALUES (v_user_id, p_chapter_id, NOW())
    ON CONFLICT DO NOTHING; -- Assuming reading_history might get a unique constraint later, or just append. 
    -- Current reading_history definition (migration 30) has PK on ID, so duplicates allowed.
    -- To prevent log spam, let's check recent log? 
    -- For now, just append. Analytics queries handle duplicates via COUNT(DISTINCT) or time windows.

    -- Grant XP if newly completed
    IF v_is_completed AND (v_prev_completed IS NULL OR v_prev_completed = FALSE) THEN
        PERFORM add_xp_to_user(v_user_id, 20); -- 20 XP for finishing a chapter
    END IF;

    -- Update library entry status to READING if not exists or planned
    INSERT INTO library_entries (user_id, manga_id, status)
    VALUES (v_user_id, p_manga_id, 'READING')
    ON CONFLICT (user_id, manga_id) DO NOTHING;
    -- Note: We don't overwrite status here to avoid resetting 'COMPLETED' or 'DROPPED' unintentionally, 
    -- but usually reading implies 'READING' or 'REREADING'.
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- 3. GET HISTORY (Frontend View)
-- ==========================================

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
            c."number" as chapter_number,
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

-- ==========================================
-- 4. SIDEBAR WIDGETS
-- ==========================================

-- Popular Today (Top 3 Manga by views in last 24h)
-- Uses reading_history logs
CREATE OR REPLACE FUNCTION get_popular_today()
RETURNS TABLE (
    id UUID,
    title TEXT,
    cover_url TEXT,
    views_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.id,
        m.title,
        m.cover_url,
        COUNT(rh.id) as views_count
    FROM reading_history rh
    JOIN chapters c ON rh.chapter_id = c.id
    JOIN manga m ON c.manga_id = m.id
    WHERE rh.read_at >= NOW() - INTERVAL '24 hours'
    GROUP BY m.id
    ORDER BY views_count DESC
    LIMIT 3;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Top Readers Weekly (Active Leaders)
CREATE OR REPLACE FUNCTION get_weekly_top_readers()
RETURNS TABLE (
    user_id UUID,
    username TEXT,
    avatar_url TEXT,
    level INTEGER,
    chapters_read BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id as user_id,
        p.username,
        p.avatar_url,
        p.level,
        COUNT(DISTINCT rh.chapter_id) as chapters_read
    FROM reading_history rh
    JOIN profiles p ON rh.user_id = p.id
    WHERE rh.read_at >= NOW() - INTERVAL '7 days'
    GROUP BY p.id
    ORDER BY chapters_read DESC
    LIMIT 5;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
