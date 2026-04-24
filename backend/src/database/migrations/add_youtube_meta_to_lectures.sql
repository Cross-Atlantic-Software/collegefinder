ALTER TABLE lectures
  ADD COLUMN IF NOT EXISTS youtube_title VARCHAR(500),
  ADD COLUMN IF NOT EXISTS youtube_channel_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS youtube_channel_id VARCHAR(64),
  ADD COLUMN IF NOT EXISTS youtube_channel_url VARCHAR(500),
  ADD COLUMN IF NOT EXISTS youtube_like_count BIGINT,
  ADD COLUMN IF NOT EXISTS youtube_subscriber_count BIGINT;

COMMENT ON COLUMN lectures.youtube_title IS 'Auto-fetched YouTube video title (if lecture source is YouTube)';
COMMENT ON COLUMN lectures.youtube_channel_name IS 'Auto-fetched YouTube channel title';
COMMENT ON COLUMN lectures.youtube_channel_id IS 'YouTube channel id associated with the lecture video';
COMMENT ON COLUMN lectures.youtube_channel_url IS 'Canonical YouTube channel URL';
COMMENT ON COLUMN lectures.youtube_like_count IS 'YouTube like count snapshot at fetch time (may be null/hidden)';
COMMENT ON COLUMN lectures.youtube_subscriber_count IS 'YouTube channel subscriber count snapshot at fetch time (may be null/hidden)';
