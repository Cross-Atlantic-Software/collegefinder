-- Widen photo_url and report_url for base64 storage; add assigned_expert_id for CRM linkage

-- admission_experts: base64 image data exceeds VARCHAR(500)
ALTER TABLE admission_experts ALTER COLUMN photo_url TYPE TEXT;

-- strength_results: base64 PDF exceeds VARCHAR(500); add consultant assignment for Strength Masters CRM
ALTER TABLE strength_results ALTER COLUMN report_url TYPE TEXT;

ALTER TABLE strength_results ADD COLUMN IF NOT EXISTS assigned_expert_id INTEGER REFERENCES admission_experts(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_strength_results_assigned_expert_id ON strength_results(assigned_expert_id);
