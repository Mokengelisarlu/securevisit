-- Adds stable device identifier column (divice_id) uniqueness per tenant DB
-- and ensures pairing is idempotent.

-- Column might already exist in some tenant DBs; add it if missing.
ALTER TABLE "devices" 
  ADD COLUMN IF NOT EXISTS "divice_id" text;

-- Enforce tenant-scoped uniqueness for the stable physical device identifier.
-- (Tenant DB is isolated per tenant; no tenant_id column exists in this schema.)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE indexname = 'devices_divice_id_unique'
  ) THEN
    CREATE UNIQUE INDEX devices_divice_id_unique ON "devices" ("divice_id") WHERE "divice_id" IS NOT NULL;
  END IF;
END $$;

