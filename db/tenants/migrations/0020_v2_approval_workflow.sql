CREATE TYPE "public"."participant_status" AS ENUM('WAITING', 'CHECKED_IN', 'CHECKED_OUT', 'NO_SHOW', 'CANCELED');--> statement-breakpoint
ALTER TYPE "public"."user_role" ADD VALUE 'HOST';--> statement-breakpoint
ALTER TYPE "public"."visit_status" ADD VALUE 'PENDING_APPROVAL';--> statement-breakpoint
ALTER TYPE "public"."visit_status" ADD VALUE 'APPROVED';--> statement-breakpoint
ALTER TYPE "public"."visit_status" ADD VALUE 'POSTPONED';--> statement-breakpoint
ALTER TYPE "public"."visit_status" ADD VALUE 'REJECTED';--> statement-breakpoint
ALTER TYPE "public"."visit_type" ADD VALUE 'GROUP';--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_id" text,
	"actor_role" text,
	"action" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" text,
	"previous_value" text,
	"new_value" text,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"recipient_id" text NOT NULL,
	"recipient_role" text,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"body" text,
	"visit_id" uuid,
	"is_read" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "visit_participants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"visit_id" uuid NOT NULL,
	"visitor_id" uuid NOT NULL,
	"status" "participant_status" DEFAULT 'WAITING',
	"checked_in_at" timestamp,
	"checked_out_at" timestamp,
	"notes" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "visit_status_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"visit_id" uuid NOT NULL,
	"from_status" text,
	"to_status" text NOT NULL,
	"actor_id" text,
	"actor_role" text,
	"reason" text,
	"metadata" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "require_host_approval" integer DEFAULT 1;--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "waiting_warning_minutes" integer DEFAULT 15;--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "waiting_critical_minutes" integer DEFAULT 30;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "host_id" uuid;--> statement-breakpoint
ALTER TABLE "visits" ADD COLUMN "group_name" text;--> statement-breakpoint
ALTER TABLE "visits" ADD COLUMN "organization" text;--> statement-breakpoint
ALTER TABLE "visits" ADD COLUMN "participant_count" integer DEFAULT 1;--> statement-breakpoint
ALTER TABLE "visits" ADD COLUMN "arrival_at" timestamp;--> statement-breakpoint
ALTER TABLE "visits" ADD COLUMN "notes" text;--> statement-breakpoint
ALTER TABLE "visits" ADD COLUMN "approved_by" text;--> statement-breakpoint
ALTER TABLE "visits" ADD COLUMN "approved_at" timestamp;--> statement-breakpoint
ALTER TABLE "visits" ADD COLUMN "rejected_by" text;--> statement-breakpoint
ALTER TABLE "visits" ADD COLUMN "rejected_at" timestamp;--> statement-breakpoint
ALTER TABLE "visits" ADD COLUMN "rejection_reason" text;--> statement-breakpoint
ALTER TABLE "visits" ADD COLUMN "postponed_by" text;--> statement-breakpoint
ALTER TABLE "visits" ADD COLUMN "postponed_at" timestamp;--> statement-breakpoint
ALTER TABLE "visits" ADD COLUMN "postpone_reason" text;--> statement-breakpoint
ALTER TABLE "visits" ADD COLUMN "new_proposed_date" timestamp;--> statement-breakpoint
ALTER TABLE "visits" ADD COLUMN "canceled_by" text;--> statement-breakpoint
ALTER TABLE "visits" ADD COLUMN "canceled_at" timestamp;--> statement-breakpoint
ALTER TABLE "visits" ADD COLUMN "cancel_reason" text;