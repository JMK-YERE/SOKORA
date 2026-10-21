-- Add password hashes for SOKORA API authentication.
-- Review and apply manually to the confirmed SOKORA Neon project/branch.
BEGIN;
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;
COMMIT;
