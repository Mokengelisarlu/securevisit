ALTER TABLE "devices" ADD COLUMN "device_id" text;--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "require_vehicle_check" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "devices" ADD CONSTRAINT "devices_device_id_unique" UNIQUE("device_id");