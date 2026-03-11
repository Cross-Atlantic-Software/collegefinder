-- Automation Sessions Table
-- Tracks workflow execution sessions for exam registration automation

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS automation_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exam_id INTEGER NOT NULL REFERENCES automation_exams(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Status tracking
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'waiting_input', 'paused', 'completed', 'failed')),
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  current_step VARCHAR(100),
  
  -- LangGraph state (for resume capability)
  graph_state JSONB DEFAULT '{}'::jsonb,
  thread_id VARCHAR(100),
  
  -- Human intervention
  -- Example: {"input_type": "otp", "field_id": "otp_field", "requested_at": "2026-01-14T10:00:00Z"}
  pending_input JSONB,
  
  -- Logs and screenshots stored as JSONB arrays
  -- Logs: [{"timestamp": "...", "level": "info", "message": "...", "node": "..."}]
  logs JSONB DEFAULT '[]'::jsonb,
  -- Screenshots: [{"timestamp": "...", "step": "...", "url": "..."}]
  -- Note: Actual base64 images stored in filesystem or S3, only URLs/paths stored here
  screenshots JSONB DEFAULT '[]'::jsonb,
  
  -- Result
  success BOOLEAN,
  result_message TEXT,
  error TEXT,
  
  -- Timestamps
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_automation_sessions_exam_id ON automation_sessions(exam_id);
CREATE INDEX IF NOT EXISTS idx_automation_sessions_user_id ON automation_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_automation_sessions_status ON automation_sessions(status);
CREATE INDEX IF NOT EXISTS idx_automation_sessions_created_at ON automation_sessions(created_at DESC);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_automation_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_automation_sessions_updated_at ON automation_sessions;
CREATE TRIGGER trigger_update_automation_sessions_updated_at
  BEFORE UPDATE ON automation_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_automation_sessions_updated_at();

-- Comments
COMMENT ON TABLE automation_sessions IS 'Workflow execution sessions for exam registration automation';
COMMENT ON COLUMN automation_sessions.graph_state IS 'LangGraph state snapshot for resume capability';
COMMENT ON COLUMN automation_sessions.pending_input IS 'Current pending human input request (OTP, captcha, custom)';
COMMENT ON COLUMN automation_sessions.logs IS 'JSONB array of workflow log entries';
