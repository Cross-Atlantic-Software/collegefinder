ALTER TABLE colleges ADD COLUMN IF NOT EXISTS linked_exam_count INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_colleges_linked_exam_count ON colleges (linked_exam_count DESC);

UPDATE colleges c
SET linked_exam_count = COALESCE(sub.cnt, 0)
FROM (
  SELECT college_id, COUNT(DISTINCT exam_id)::int AS cnt
  FROM (
    SELECT college_id, exam_id
    FROM college_recommended_exams
    UNION
    SELECT cp.college_id, btrim(tok.raw)::int AS exam_id
    FROM college_programs cp
    CROSS JOIN LATERAL unnest(string_to_array(cp.recommended_exam_ids, ',')) AS tok(raw)
    WHERE cp.recommended_exam_ids IS NOT NULL
      AND btrim(cp.recommended_exam_ids) <> ''
      AND btrim(tok.raw) ~ '^[0-9]+$'
  ) AS links
  GROUP BY college_id
) AS sub
WHERE c.id = sub.college_id;
