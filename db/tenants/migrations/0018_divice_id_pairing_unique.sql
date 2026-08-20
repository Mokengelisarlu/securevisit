-- Adds stable device identifier column uniqueness per tenant DB
-- and ensures pairing is idempotent.

-- Ensure the current device_id column exists, migrating legacy divice_id if needed.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'devices' AND column_name = 'device_id'
  ) THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'devices' AND column_name = 'divice_id'
    ) THEN
      ALTER TABLE "devices" RENAME COLUMN "divice_id" TO "device_id";
    ELSE
      ALTER TABLE "devices" ADD COLUMN "device_id" text;
    END IF;
  END IF;
END $$;

-- Enforce tenant-scoped uniqueness for the stable physical device identifier.
-- (Tenant DB is isolated per tenant; no tenant_id column exists in this schema.)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE indexname = 'devices_device_id_unique'
  ) THEN
    IF EXISTS (
      SELECT 1
      FROM pg_indexes
      WHERE indexname = 'devices_divice_id_unique'
    ) THEN
      ALTER INDEX devices_divice_id_unique RENAME TO devices_device_id_unique;
    ELSE
      CREATE UNIQUE INDEX devices_device_id_unique ON "devices" ("device_id") WHERE "device_id" IS NOT NULL;
    END IF;
  END IF;
END $$;

