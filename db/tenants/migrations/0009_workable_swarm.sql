CREATE TABLE "devices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text,
	"device_type" text DEFAULT 'KIOSK',
	"pairing_code" text,
	"pairing_code_expires_at" timestamp,
	"device_token" text,
	"is_paired" integer DEFAULT 0,
	"paired_at" timestamp,
	"last_active_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
