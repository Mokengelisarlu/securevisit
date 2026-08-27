CREATE TYPE "public"."command_priority" AS ENUM('low', 'medium', 'high', 'critical');--> statement-breakpoint
CREATE TYPE "public"."command_status" AS ENUM('pending', 'acked', 'applied', 'failed');--> statement-breakpoint
CREATE TABLE "commands" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"device_id" uuid NOT NULL,
	"type" text NOT NULL,
	"payload" jsonb,
	"status" "command_status" DEFAULT 'pending' NOT NULL,
	"priority" "command_priority" DEFAULT 'medium' NOT NULL,
	"ack_at" timestamp,
	"applied_at" timestamp,
	"error" text,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "commands" ADD CONSTRAINT "commands_device_id_devices_id_fk" FOREIGN KEY ("device_id") REFERENCES "public"."devices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "commands_device_id_idx" ON "commands" USING btree ("device_id");--> statement-breakpoint
CREATE INDEX "commands_status_idx" ON "commands" USING btree ("status");--> statement-breakpoint
CREATE INDEX "commands_expires_at_idx" ON "commands" USING btree ("expires_at");