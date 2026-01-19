-- Automation Exams Table
-- Stores exam configurations for browser automation workflows
-- This is separate from exams_taxonomies which stores exam metadata for user selection

CREATE TABLE IF NOT EXISTS automation_exams (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  url TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Field mappings for form filling (JSON structure)
  -- Example: {"fullName": {"type": "text", "required": true}, "phone": {"type": "phone"}}
  field_mappings JSONB DEFAULT '{}'::jsonb,
  
  -- Agent configuration for LLM/Stagehand
  -- Example: {"max_retries": 3, "screenshot_interval_ms": 1000, "captcha": {"auto_solve_enabled": false}}
  agent_config JSONB DEFAULT '{
    "max_retries": 3,
    "screenshot_interval_ms": 1000,
    "human_intervention_timeout_seconds": 300,
    "success_patterns": [],
    "error_patterns": [],
    "captcha": {
      "auto_solve_enabled": false,
      "provider": "manual",
      "timeout_seconds": 30
    }
  }'::jsonb,
  
  -- Notification settings
  notify_on_complete BOOLEAN DEFAULT TRUE,
  notify_on_failure BOOLEAN DEFAULT TRUE,
  notification_emails TEXT[] DEFAULT ARRAY[]::TEXT[],
  
  -- Workflow recording (populated by admin when creating workflow)
  workflow_steps JSONB DEFAULT NULL,
  workflow_status VARCHAR(20) DEFAULT NULL, -- 'draft', 'active', 'deprecated'
  workflow_version INT DEFAULT 0,
  workflow_created_by INT DEFAULT NULL,
  workflow_created_at TIMESTAMP DEFAULT NULL,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_automation_exams_slug ON automation_exams(slug);
CREATE INDEX IF NOT EXISTS idx_automation_exams_is_active ON automation_exams(is_active);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_automation_exams_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_automation_exams_updated_at ON automation_exams;
CREATE TRIGGER trigger_update_automation_exams_updated_at
  BEFORE UPDATE ON automation_exams
  FOR EACH ROW
  EXECUTE FUNCTION update_automation_exams_updated_at();

-- Comments
COMMENT ON TABLE automation_exams IS 'Exam configurations for browser automation workflows';
COMMENT ON COLUMN automation_exams.slug IS 'URL-friendly unique identifier (e.g., pwnsat, jee-main-2026)';
COMMENT ON COLUMN automation_exams.url IS 'Registration page URL to automate';
COMMENT ON COLUMN automation_exams.field_mappings IS 'JSONB mapping of user data fields to form field configurations';
COMMENT ON COLUMN automation_exams.agent_config IS 'JSONB configuration for LLM agent behavior';
