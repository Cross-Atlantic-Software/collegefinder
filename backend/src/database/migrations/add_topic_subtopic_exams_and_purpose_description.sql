-- Topic-Exams: link up to 10 exams per topic
CREATE TABLE IF NOT EXISTS topic_exams (
  topic_id INTEGER NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  exam_id INTEGER NOT NULL REFERENCES exams_taxonomies(id) ON DELETE CASCADE,
  PRIMARY KEY (topic_id, exam_id)
);
CREATE INDEX IF NOT EXISTS idx_topic_exams_topic_id ON topic_exams(topic_id);
CREATE INDEX IF NOT EXISTS idx_topic_exams_exam_id ON topic_exams(exam_id);

-- Subtopic-Exams: link up to 10 exams per subtopic
CREATE TABLE IF NOT EXISTS subtopic_exams (
  subtopic_id INTEGER NOT NULL REFERENCES subtopics(id) ON DELETE CASCADE,
  exam_id INTEGER NOT NULL REFERENCES exams_taxonomies(id) ON DELETE CASCADE,
  PRIMARY KEY (subtopic_id, exam_id)
);
CREATE INDEX IF NOT EXISTS idx_subtopic_exams_subtopic_id ON subtopic_exams(subtopic_id);
CREATE INDEX IF NOT EXISTS idx_subtopic_exams_exam_id ON subtopic_exams(exam_id);

-- Purposes: add description
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'purposes') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'purposes' AND column_name = 'description'
    ) THEN
      ALTER TABLE purposes ADD COLUMN description TEXT;
    END IF;
  END IF;
END $$;
