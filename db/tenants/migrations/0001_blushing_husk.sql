CREATE TYPE "public"."user_role" AS ENUM('ADMIN', 'HOST', 'SECURITY');--> statement-breakpoint
CREATE TYPE "public"."visit_status" AS ENUM('IN', 'OUT', 'CANCELLED');--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "role" SET DATA TYPE "public"."user_role" USING "role"::"public"."user_role";--> statement-breakpoint
ALTER TABLE "visitors" ADD COLUMN "created_at" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "visits" ADD COLUMN "visit_number" text NOT NULL;--> statement-breakpoint
ALTER TABLE "visits" ADD COLUMN "visit_date" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "visits" ADD COLUMN "purpose" text;--> statement-breakpoint
ALTER TABLE "visits" ADD COLUMN "last_visited_with" text;--> statement-breakpoint
ALTER TABLE "visits" ADD COLUMN "duration_minutes" integer;--> statement-breakpoint
ALTER TABLE "visits" ADD COLUMN "activity_done" text;--> statement-breakpoint
ALTER TABLE "visits" ADD COLUMN "status" "visit_status" DEFAULT 'IN';--> statement-breakpoint
ALTER TABLE "visitors" DROP COLUMN "status";--> statement-breakpoint
ALTER TABLE "visitors" DROP COLUMN "signed_at";--> statement-breakpoint
DROP TYPE "public"."visitor_status";