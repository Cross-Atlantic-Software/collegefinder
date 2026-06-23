-- Add chapters taxonomy: stream -> subject -> chapter -> topic -> subtopic
-- Migrates existing topics.sub_id into chapters + topics.chapter_id

CREATE TABLE IF NOT EXISTS chapters (
  id SERIAL PRIMARY KEY,
  sub_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  status BOOLEAN DEFAULT TRUE,
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chapters_sub_id_name_key'
  ) THEN
    ALTER TABLE chapters ADD CONSTRAINT chapters_sub_id_name_key UNIQUE (sub_id, name);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_chapters_sub_id ON chapters(sub_id);

-- Backfill one default chapter per subject that has topics (only if sub_id column still exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'topics' AND column_name = 'sub_id'
  ) THEN
    INSERT INTO chapters (sub_id, name, status, sort_order)
    SELECT DISTINCT t.sub_id, 'General', TRUE, 0
    FROM topics t
    WHERE t.sub_id IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM chapters c
        WHERE c.sub_id = t.sub_id AND LOWER(TRIM(c.name)) = 'general'
      );
  END IF;
END $$;

ALTER TABLE topics ADD COLUMN IF NOT EXISTS chapter_id INTEGER REFERENCES chapters(id) ON DELETE CASCADE;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'topics' AND column_name = 'sub_id'
  ) THEN
    UPDATE topics t
    SET chapter_id = c.id
    FROM chapters c
    WHERE t.chapter_id IS NULL
      AND t.sub_id = c.sub_id
      AND LOWER(TRIM(c.name)) = 'general';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'topics' AND column_name = 'sub_id'
  ) AND EXISTS (
    SELECT 1 FROM topics WHERE chapter_id IS NULL
  ) THEN
    INSERT INTO chapters (sub_id, name, status, sort_order)
    SELECT DISTINCT t.sub_id, 'General', TRUE, 0
    FROM topics t
    WHERE t.chapter_id IS NULL AND t.sub_id IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM chapters c
        WHERE c.sub_id = t.sub_id AND LOWER(TRIM(c.name)) = 'general'
      );

    UPDATE topics t
    SET chapter_id = c.id
    FROM chapters c
    WHERE t.chapter_id IS NULL
      AND t.sub_id = c.sub_id
      AND LOWER(TRIM(c.name)) = 'general';
  END IF;
END $$;

ALTER TABLE topics DROP CONSTRAINT IF EXISTS topics_sub_id_name_key;
DROP INDEX IF EXISTS idx_topics_sub_id;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'topics' AND column_name = 'sub_id'
  ) THEN
    ALTER TABLE topics DROP COLUMN sub_id;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM topics WHERE chapter_id IS NULL
  ) THEN
  ELSE
    ALTER TABLE topics ALTER COLUMN chapter_id SET NOT NULL;
  END IF;
EXCEPTION
  WHEN others THEN
    NULL;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'topics_chapter_id_name_key'
  ) THEN
    ALTER TABLE topics ADD CONSTRAINT topics_chapter_id_name_key UNIQUE (chapter_id, name);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_topics_chapter_id ON topics(chapter_id);

INSERT INTO modules (name, code)
SELECT 'Chapters', 'chapters'
WHERE NOT EXISTS (SELECT 1 FROM modules WHERE code = 'chapters');
