-- Link existing automation_exams rows to exams_taxonomies by slug/code or exact name.

UPDATE automation_exams ae
   SET taxonomy_exam_id = et.id
  FROM exams_taxonomies et
 WHERE ae.taxonomy_exam_id IS NULL
   AND (
     LOWER(REPLACE(COALESCE(et.code, ''), '_', '-')) = LOWER(ae.slug)
     OR LOWER(et.code) = REPLACE(LOWER(ae.slug), '-', '_')
     OR LOWER(TRIM(et.name)) = LOWER(TRIM(ae.name))
   );
