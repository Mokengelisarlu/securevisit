CREATE TABLE "settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nda_policy_text" text,
	"require_signature" integer DEFAULT 1,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "visits" ADD COLUMN "signature_data" text;--> statement-breakpoint
ALTER TABLE "visits" ADD COLUMN "policy_accepted_at" timestamp;