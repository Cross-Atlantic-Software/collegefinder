-- Support multiple assigned consultants per strength result (multiselect)
-- Add assigned_expert_ids array, migrate from assigned_expert_id, drop single column

ALTER TABLE strength_results ADD COLUMN IF NOT EXISTS assigned_expert_ids INTEGER[] DEFAULT '{}';

UPDATE strength_results
SET assigned_expert_ids = CASE
  WHEN assigned_expert_id IS NOT NULL THEN ARRAY[assigned_expert_id]
  ELSE '{}'
END
WHERE assigned_expert_ids = '{}' OR assigned_expert_ids IS NULL;

ALTER TABLE strength_results DROP COLUMN IF EXISTS assigned_expert_id;
DROP INDEX IF EXISTS idx_strength_results_assigned_expert_id;

CREATE INDEX IF NOT EXISTS idx_strength_results_assigned_expert_ids ON strength_results USING GIN(assigned_expert_ids);
