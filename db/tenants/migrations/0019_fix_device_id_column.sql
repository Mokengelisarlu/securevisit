-- Repair migration: ensure the devices table has device_id for all tenants.
-- This fixes tenant DBs where the legacy column was missing or the previous migration did not create it.

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
