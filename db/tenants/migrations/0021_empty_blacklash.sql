CREATE TYPE "public"."device_event_type" AS ENUM('CHECK_IN', 'CHECKOUT', 'ERROR', 'SCREEN_CHANGE', 'COMMAND_APPLIED', 'COMMAND_FAILED', 'REBOOT', 'ONLINE', 'OFFLINE');--> statement-breakpoint
CREATE TABLE "device_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"device_id" uuid NOT NULL,
	"type" "device_event_type" NOT NULL,
	"severity" text DEFAULT 'info',
	"message" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "device_events" ADD CONSTRAINT "device_events_device_id_devices_id_fk" FOREIGN KEY ("device_id") REFERENCES "public"."devices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "device_events_device_id_idx" ON "device_events" USING btree ("device_id");--> statement-breakpoint
CREATE INDEX "device_events_type_idx" ON "device_events" USING btree ("type");--> statement-breakpoint
CREATE INDEX "device_events_created_at_idx" ON "device_events" USING btree ("created_at");