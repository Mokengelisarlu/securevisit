-- Drop the authorized_users if it already exists (from a failed partial run)
DROP TABLE IF EXISTS "authorized_users";

-- Recreate authorized_users with full identity fields
CREATE TABLE "authorized_users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"first_name" text NOT NULL DEFAULT '',
	"last_name" text NOT NULL DEFAULT '',
	"middle_name" text,
	"role" "user_role" NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "authorized_users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
-- Rename existing "name" column to "first_name"
ALTER TABLE "users" RENAME COLUMN "name" TO "first_name";
--> statement-breakpoint
-- Add "last_name" as nullable first to avoid NOT NULL constraint failure on existing rows
ALTER TABLE "users" ADD COLUMN "last_name" text;
--> statement-breakpoint
-- Fill in empty string for any existing rows that have NULL last_name
UPDATE "users" SET "last_name" = '' WHERE "last_name" IS NULL;
--> statement-breakpoint
-- Now apply NOT NULL constraint
ALTER TABLE "users" ALTER COLUMN "last_name" SET NOT NULL;
--> statement-breakpoint
-- Add optional middle_name
ALTER TABLE "users" ADD COLUMN "middle_name" text;