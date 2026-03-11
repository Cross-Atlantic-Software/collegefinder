-- User Document Vault Table Schema
-- This file defines the user_document_vault table structure for storing user documents

-- User document vault table
CREATE TABLE IF NOT EXISTS user_document_vault (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Mandatory Uploads
  passport_size_photograph VARCHAR(500), -- S3 URL for passport-size photograph
  signature_image VARCHAR(500), -- S3 URL for signature image
  
  -- Identity & Academic Proof
  matric_marksheet VARCHAR(500), -- S3 URL for matric marksheet
  matric_certificate VARCHAR(500), -- S3 URL for matric certificate
  postmatric_marksheet VARCHAR(500), -- S3 URL for postmatric marksheet (if passed)
  valid_photo_id_proof VARCHAR(500), -- S3 URL for valid photo ID proof
  
  -- Category and Reservation Documents (if applicable)
  sc_certificate VARCHAR(500), -- S3 URL for SC certificate
  st_certificate VARCHAR(500), -- S3 URL for ST certificate
  obc_ncl_certificate VARCHAR(500), -- S3 URL for OBC-NCL certificate
  ews_certificate VARCHAR(500), -- S3 URL for EWS certificate
  pwbd_disability_certificate VARCHAR(500), -- S3 URL for PwBD/Disability certificate
  udid_card VARCHAR(500), -- S3 URL for UDID card
  domicile_certificate VARCHAR(500), -- S3 URL for Domicile certificate (State Quota Exams)
  
  -- Additional Uploads (exam dependent)
  citizenship_certificate VARCHAR(500), -- S3 URL for Citizenship certificate (OCI/PIO, if applicable)
  migration_certificate VARCHAR(500), -- S3 URL for Migration certificate
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id)
);

-- Ensure all columns exist on older databases
ALTER TABLE user_document_vault ADD COLUMN IF NOT EXISTS passport_size_photograph VARCHAR(500);
ALTER TABLE user_document_vault ADD COLUMN IF NOT EXISTS signature_image VARCHAR(500);
ALTER TABLE user_document_vault ADD COLUMN IF NOT EXISTS matric_marksheet VARCHAR(500);
ALTER TABLE user_document_vault ADD COLUMN IF NOT EXISTS matric_certificate VARCHAR(500);
ALTER TABLE user_document_vault ADD COLUMN IF NOT EXISTS postmatric_marksheet VARCHAR(500);
ALTER TABLE user_document_vault ADD COLUMN IF NOT EXISTS valid_photo_id_proof VARCHAR(500);
ALTER TABLE user_document_vault ADD COLUMN IF NOT EXISTS sc_certificate VARCHAR(500);
ALTER TABLE user_document_vault ADD COLUMN IF NOT EXISTS st_certificate VARCHAR(500);
ALTER TABLE user_document_vault ADD COLUMN IF NOT EXISTS obc_ncl_certificate VARCHAR(500);
ALTER TABLE user_document_vault ADD COLUMN IF NOT EXISTS ews_certificate VARCHAR(500);
ALTER TABLE user_document_vault ADD COLUMN IF NOT EXISTS pwbd_disability_certificate VARCHAR(500);
ALTER TABLE user_document_vault ADD COLUMN IF NOT EXISTS udid_card VARCHAR(500);
ALTER TABLE user_document_vault ADD COLUMN IF NOT EXISTS domicile_certificate VARCHAR(500);
ALTER TABLE user_document_vault ADD COLUMN IF NOT EXISTS citizenship_certificate VARCHAR(500);
ALTER TABLE user_document_vault ADD COLUMN IF NOT EXISTS migration_certificate VARCHAR(500);

-- Add comments
COMMENT ON TABLE user_document_vault IS 'Stores user document vault with all uploaded documents (S3 URLs)';
COMMENT ON COLUMN user_document_vault.passport_size_photograph IS 'S3 URL for passport-size photograph (Mandatory)';
COMMENT ON COLUMN user_document_vault.signature_image IS 'S3 URL for signature image (Mandatory)';
COMMENT ON COLUMN user_document_vault.matric_marksheet IS 'S3 URL for matric marksheet';
COMMENT ON COLUMN user_document_vault.matric_certificate IS 'S3 URL for matric certificate';
COMMENT ON COLUMN user_document_vault.postmatric_marksheet IS 'S3 URL for postmatric marksheet (if passed)';
COMMENT ON COLUMN user_document_vault.valid_photo_id_proof IS 'S3 URL for valid photo ID proof';
COMMENT ON COLUMN user_document_vault.sc_certificate IS 'S3 URL for SC certificate (if applicable)';
COMMENT ON COLUMN user_document_vault.st_certificate IS 'S3 URL for ST certificate (if applicable)';
COMMENT ON COLUMN user_document_vault.obc_ncl_certificate IS 'S3 URL for OBC-NCL certificate (if applicable)';
COMMENT ON COLUMN user_document_vault.ews_certificate IS 'S3 URL for EWS certificate (if applicable)';
COMMENT ON COLUMN user_document_vault.pwbd_disability_certificate IS 'S3 URL for PwBD/Disability certificate (if applicable)';
COMMENT ON COLUMN user_document_vault.udid_card IS 'S3 URL for UDID card (if applicable)';
COMMENT ON COLUMN user_document_vault.domicile_certificate IS 'S3 URL for Domicile certificate - State Quota Exams (if applicable)';
COMMENT ON COLUMN user_document_vault.citizenship_certificate IS 'S3 URL for Citizenship certificate (OCI/PIO, if applicable)';
COMMENT ON COLUMN user_document_vault.migration_certificate IS 'S3 URL for Migration certificate (exam dependent)';

-- Indexes for user_document_vault table
CREATE INDEX IF NOT EXISTS idx_user_document_vault_user_id ON user_document_vault(user_id);

-- Trigger to automatically update updated_at for user_document_vault
DROP TRIGGER IF EXISTS update_user_document_vault_updated_at ON user_document_vault;
CREATE TRIGGER update_user_document_vault_updated_at BEFORE UPDATE ON user_document_vault
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

