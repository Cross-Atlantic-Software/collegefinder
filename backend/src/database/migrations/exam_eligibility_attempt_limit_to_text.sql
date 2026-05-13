-- Store attempt limit as free text (e.g. "3", "Unlimited") instead of INTEGER only.

ALTER TABLE exam_eligibility_criteria
  ALTER COLUMN attempt_limit TYPE VARCHAR(200)
  USING (
    CASE
      WHEN attempt_limit IS NULL THEN NULL
      ELSE trim(attempt_limit::text)
    END
  );
