-- Rename column divice_id -> device_id if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'devices' AND column_name = 'divice_id'
  ) THEN
    ALTER TABLE devices RENAME COLUMN divice_id TO device_id;
  END IF;
END$$;

-- Ensure unique constraint exists on device_id
DO $$
BEGIN
  -- Only add the constraint if the column actually exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'devices' AND column_name = 'device_id'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conname = 'devices_device_id_unique'
    ) THEN
      ALTER TABLE devices
      ADD CONSTRAINT devices_device_id_unique UNIQUE (device_id);
    END IF;
  END IF;
END$$;
