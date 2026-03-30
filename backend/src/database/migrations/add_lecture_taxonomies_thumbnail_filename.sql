-- Self-study material (lectures): taxonomy links + Excel/ZIP thumbnail filename
ALTER TABLE lectures ADD COLUMN IF NOT EXISTS thumbnail_filename VARCHAR(255);

CREATE TABLE IF NOT EXISTS lecture_streams (
  lecture_id INTEGER NOT NULL REFERENCES lectures(id) ON DELETE CASCADE,
  stream_id INTEGER NOT NULL REFERENCES streams(id) ON DELETE CASCADE,
  PRIMARY KEY (lecture_id, stream_id)
);
CREATE INDEX IF NOT EXISTS idx_lecture_streams_stream ON lecture_streams(stream_id);

CREATE TABLE IF NOT EXISTS lecture_subjects (
  lecture_id INTEGER NOT NULL REFERENCES lectures(id) ON DELETE CASCADE,
  subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  PRIMARY KEY (lecture_id, subject_id)
);
CREATE INDEX IF NOT EXISTS idx_lecture_subjects_subject ON lecture_subjects(subject_id);

CREATE TABLE IF NOT EXISTS lecture_exams (
  lecture_id INTEGER NOT NULL REFERENCES lectures(id) ON DELETE CASCADE,
  exam_id INTEGER NOT NULL REFERENCES exams_taxonomies(id) ON DELETE CASCADE,
  PRIMARY KEY (lecture_id, exam_id)
);
CREATE INDEX IF NOT EXISTS idx_lecture_exams_exam ON lecture_exams(exam_id);
