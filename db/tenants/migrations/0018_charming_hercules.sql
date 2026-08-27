DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'devices' AND column_name = 'device_id'
  ) THEN
    ALTER TABLE "devices" ADD COLUMN "device_id" text;
  END IF;
END $$;--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "require_vehicle_check" integer DEFAULT 0;--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'devices_device_id_unique'
  ) THEN
    ALTER TABLE "devices" ADD CONSTRAINT "devices_device_id_unique" UNIQUE("device_id");
  END IF;
END $$;