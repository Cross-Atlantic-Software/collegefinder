-- Check if stream_id migration has been completed
-- Run this query to see if existing stream values have been migrated to stream_id

SELECT 
  COUNT(*) as total_rows,
  COUNT(stream_id) as rows_with_stream_id,
  COUNT(CASE WHEN stream IS NOT NULL AND stream_id IS NULL THEN 1 END) as rows_needing_migration
FROM user_academics
WHERE stream IS NOT NULL;

-- If rows_needing_migration > 0, the migration hasn't been run yet
-- If rows_needing_migration = 0, the migration has been completed and the file can be deleted

