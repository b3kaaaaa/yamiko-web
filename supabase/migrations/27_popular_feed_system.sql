-- Migration: 27_popular_feed_system.sql
-- Description: Materialized view for trending stats and RPC for popular feed
-- Author: Yamiko Backend Architect

-- ==========================================
-- 1. MATERIALIZED VIEW: POPULARITY STATS
-- ==========================================
-- Aggregates views and calculates trend scores.
-- Intended to be refreshed periodically (e.g., hourly).

CREATE MATERIALIZED VIEW IF NOT EXISTS manga_popularity_stats AS
WITH recent_activity AS (
    SELECT
        c.manga_id,
        COUNT(*) FILTER (WHERE rh.read_at >= NOW() - INTERVAL '7 days') AS views_7_days,
        COUNT(*) FILTER (WHERE rh.read_at >= NOW() - INTERVAL '30 days') AS views_30_days
    FROM reading_history rh
    JOIN chapters c ON rh.chapter_id = c.id
    GROUP BY c.manga_id
)
SELECT
    m.id AS manga_id,
    COALESCE(ra.views_7_days, 0) AS views_7_days,
    COALESCE(ra.views_30_days, 0) AS views_30_days,
    m.views AS views_all_time,
    m.rating AS rating_score,
    -- Trend Score Algo: Recent activity heavily weighted, plus rating quality
    -- Formula: (7d_views * 2) + (Rating * 10)
    (COALESCE(ra.views_7_days, 0) * 2) + (COALESCE(m.rating, 0) * 10) AS trend_score,
    NOW() AS last_refreshed
FROM manga m
LEFT JOIN recent_activity ra ON m.id = ra.manga_id;

-- Indexes for performance
CREATE UNIQUE INDEX IF NOT EXISTS idx_mps_manga_id ON manga_popularity_stats(manga_id);
CREATE INDEX IF NOT EXISTS idx_mps_trend_score ON manga_popularity_stats(trend_score DESC);
CREATE INDEX IF NOT EXISTS idx_mps_views_7_days ON manga_popularity_stats(views_7_days DESC);
CREATE INDEX IF NOT EXISTS idx_mps_rating ON manga_popularity_stats(rating_score DESC);

-- Helper to refresh view
CREATE OR REPLACE FUNCTION refresh_manga_popularity()
RETURNS VOID AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY manga_popularity_stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- 2. TYPE DEFINITION (Optional - for clarity)
-- ==========================================
-- We rely on JSON return for flexibility, but could define a type if strictness needed.

-- ==========================================
-- 3. MAIN RPC: GET POPULAR FEED
-- ==========================================
CREATE OR REPLACE FUNCTION get_popular_feed(
    filter_type TEXT DEFAULT 'trending', -- 'views', 'rating', 'trending'
    time_period TEXT DEFAULT '7_days',   -- '7_days', '30_days', 'all_time'
    search_query TEXT DEFAULT NULL,
    feed_mode TEXT DEFAULT 'general',    -- 'general', 'for_you', 'for_him', 'for_her'
    page INTEGER DEFAULT 1,
    limit_count INTEGER DEFAULT 20,
    p_user_id UUID DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    v_offset INTEGER;
    v_total INTEGER;
    v_user_tags TEXT[];
    v_query TEXT;
    v_count_query TEXT;
    v_where_clauses TEXT[] := ARRAY['TRUE'];
    v_order_clause TEXT;
    v_result JSON;
BEGIN
    -- Validation / Defaults
    IF page < 1 THEN page := 1; END IF;
    IF limit_count < 1 THEN limit_count := 20; END IF;
    IF limit_count > 100 THEN limit_count := 100; END IF;
    v_offset := (page - 1) * limit_count;

    -- A. Personalization Logic (For You)
    IF feed_mode = 'for_you' AND p_user_id IS NOT NULL THEN
        -- Get top 3 tags from reading history
        SELECT ARRAY_AGG(t.name) INTO v_user_tags
        FROM (
            SELECT t.name
            FROM reading_history rh
            JOIN chapters c ON rh.chapter_id = c.id
            JOIN manga_tags mt ON c.manga_id = mt.manga_id
            JOIN tags t ON mt.tag_id = t.id
            WHERE rh.user_id = p_user_id
            GROUP BY t.name
            ORDER BY COUNT(*) DESC
            LIMIT 3
        ) t;
    END IF;

    -- B. Build Dynamic Query CTEs
    -- We select IDs first for speed, then join details
    v_query := '
        FROM manga m
        JOIN manga_popularity_stats mps ON m.id = mps.manga_id
    ';

    -- C. Filters
    IF search_query IS NOT NULL AND search_query != '' THEN
        v_where_clauses := array_append(v_where_clauses, format('m.title ILIKE %L', '%' || search_query || '%'));
    END IF;

    -- Feed Mode Filters (Deep Logic)
    IF feed_mode = 'for_him' THEN
        -- Shonen / Seinen Focus
        v_where_clauses := array_append(v_where_clauses, 'EXISTS (
            SELECT 1 FROM manga_genres mg 
            JOIN genres g ON mg.genre_id = g.id 
            WHERE mg.manga_id = m.id 
            AND g.name = ANY(ARRAY[''Action'', ''System'', ''Ecchi'', ''Mecha'', ''Sports'', ''Seinen'', ''Shonen''])
        )');
    ELSIF feed_mode = 'for_her' THEN
        -- Shoujo / Josei Focus
        v_where_clauses := array_append(v_where_clauses, 'EXISTS (
            SELECT 1 FROM manga_genres mg 
            JOIN genres g ON mg.genre_id = g.id 
            WHERE mg.manga_id = m.id 
            AND g.name = ANY(ARRAY[''Romance'', ''Villainess'', ''Josei'', ''Shoujo'', ''Drama'', ''Slice of Life''])
        )');
    ELSIF feed_mode = 'for_you' THEN
        IF p_user_id IS NOT NULL AND v_user_tags IS NOT NULL THEN
             v_where_clauses := array_append(v_where_clauses, format('EXISTS (
                SELECT 1 FROM manga_tags mt 
                JOIN tags t ON mt.tag_id = t.id 
                WHERE mt.manga_id = m.id 
                AND t.name = ANY(%L)
            )', v_user_tags));
        ELSE
            -- Fallback for guest or no history -> behaves like "general"
            NULL; 
        END IF;
    END IF;

    -- Combine Where Clauses
    v_query := v_query || ' WHERE ' || array_to_string(v_where_clauses, ' AND ');

    -- D. Order By
    -- Logic: We prioritize the filter_type
    IF filter_type = 'views' THEN
        IF time_period = '7_days' THEN
            v_order_clause := 'mps.views_7_days DESC';
        ELSIF time_period = '30_days' THEN
            v_order_clause := 'mps.views_30_days DESC';
        ELSE
            v_order_clause := 'mps.views_all_time DESC';
        END IF;
    ELSIF filter_type = 'rating' THEN
        v_order_clause := 'm.rating DESC NULLS LAST';
    ELSE 
        -- Default to Trending Score
        v_order_clause := 'mps.trend_score DESC';
    END IF;

    -- Add secondary sort for stability
    v_order_clause := v_order_clause || ', m.id DESC';

    -- E. Execute Count
    v_count_query := 'SELECT COUNT(*) ' || v_query;
    EXECUTE v_count_query INTO v_total;

    -- F. Execute Main Selection
    -- We fetch specific fields to match frontend
    EXECUTE format('
        SELECT json_build_object(
            ''data'', COALESCE(json_agg(row_to_json(t)), ''[]''::json),
            ''meta'', json_build_object(
                ''total'', %s,
                ''page'', %s,
                ''limit'', %s,
                ''feed_mode'', %L,
                ''debug_tags'', %L
            )
        )
        FROM (
            SELECT
                m.id,
                m.title,
                m.slug,
                m.cover_url,
                m.rating,
                m.status,
                m.type,
                mps.trend_score,
                mps.views_7_days,
                
                -- Aggregated Genres (First 3)
                (
                    SELECT COALESCE(json_agg(g.name), ''[]''::json)
                    FROM (
                        SELECT g.name 
                        FROM manga_genres mg 
                        JOIN genres g ON mg.genre_id = g.id 
                        WHERE mg.manga_id = m.id 
                        -- LIMIT 3 -- Optional limit
                    ) g
                ) as genres

            %s -- Base Query (FROM ... WHERE ...)
            ORDER BY %s
            LIMIT %s OFFSET %s
        ) t
    ', 
    v_total, page, limit_count, feed_mode, v_user_tags, -- Meta args
    v_query, v_order_clause, limit_count, v_offset -- Query args
    ) INTO v_result;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
