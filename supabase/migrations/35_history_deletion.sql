-- Migration: 35_history_deletion.sql
-- Description: RPC for bulk deleting reading history entries.

CREATE OR REPLACE FUNCTION delete_reading_progress(
    p_manga_ids UUID[]
)
RETURNS VOID AS $$
BEGIN
    DELETE FROM reading_progress
    WHERE user_id = auth.uid()
    AND manga_id = ANY(p_manga_ids);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant access
GRANT EXECUTE ON FUNCTION delete_reading_progress TO authenticated;
