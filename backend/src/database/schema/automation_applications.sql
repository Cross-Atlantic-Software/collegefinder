-- Automation Applications Table
-- Tracks user applications for exam automation (the queue of pending/approved automation requests)

CREATE TABLE IF NOT EXISTS automation_applications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  exam_id INTEGER NOT NULL REFERENCES automation_exams(id) ON DELETE CASCADE,
  
  -- Application status
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'running', 'completed', 'failed')),
  
  -- Link to active session (when running)
  session_id UUID REFERENCES automation_sessions(id) ON DELETE SET NULL,
  
  -- Admin who approved (if applicable)
  approved_by INTEGER REFERENCES admin_users(id) ON DELETE SET NULL,
  approved_at TIMESTAMP,
  
  -- Notes/comments
  admin_notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Prevent duplicate applications for same user+exam that are still pending/running
  CONSTRAINT unique_active_application UNIQUE (user_id, exam_id, status)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_automation_applications_user_id ON automation_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_automation_applications_exam_id ON automation_applications(exam_id);
CREATE INDEX IF NOT EXISTS idx_automation_applications_status ON automation_applications(status);
CREATE INDEX IF NOT EXISTS idx_automation_applications_created_at ON automation_applications(created_at DESC);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_automation_applications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_automation_applications_updated_at ON automation_applications;
CREATE TRIGGER trigger_update_automation_applications_updated_at
  BEFORE UPDATE ON automation_applications
  FOR EACH ROW
  EXECUTE FUNCTION update_automation_applications_updated_at();

-- Comments
COMMENT ON TABLE automation_applications IS 'User applications for exam automation - the approval queue';
COMMENT ON COLUMN automation_applications.status IS 'Application status: pending (needs approval), approved (ready to run), running (in progress), completed, failed';
COMMENT ON COLUMN automation_applications.session_id IS 'Reference to active automation session when running';
