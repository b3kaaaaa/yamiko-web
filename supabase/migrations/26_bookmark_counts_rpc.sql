-- RPC to get bookmark counts by status and favorites
CREATE OR REPLACE FUNCTION get_user_bookmark_counts(user_uuid UUID)
RETURNS TABLE (status TEXT, count BIGINT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT library_entries.status, count(*)
  FROM library_entries
  WHERE user_id = user_uuid
  GROUP BY library_entries.status
  UNION ALL
  SELECT 'FAVORITE'::TEXT, count(*)
  FROM library_entries
  WHERE user_id = user_uuid AND is_favorite = true;
END;
$$;
