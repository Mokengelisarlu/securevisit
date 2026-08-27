CREATE TYPE "public"."notification_type" AS ENUM('VISIT_REQUEST_CREATED', 'VISIT_APPROVED', 'VISIT_REJECTED', 'VISIT_POSTPONED', 'VISIT_CANCELLED', 'VISITOR_CHECKED_IN', 'VISITOR_CHECKED_OUT', 'VISITOR_NO_SHOW');--> statement-breakpoint
ALTER TYPE "public"."participant_status" ADD VALUE 'EXPECTED' BEFORE 'WAITING';--> statement-breakpoint
ALTER TABLE "notifications" ALTER COLUMN "type" SET DATA TYPE "public"."notification_type" USING "type"::"public"."notification_type";--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "read_at" timestamp;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_visit_id_visits_id_fk" FOREIGN KEY ("visit_id") REFERENCES "public"."visits"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "visit_status_history" ADD CONSTRAINT "visit_status_history_visit_id_visits_id_fk" FOREIGN KEY ("visit_id") REFERENCES "public"."visits"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "notifications_recipient_idx" ON "notifications" USING btree ("recipient_id","is_read","created_at");--> statement-breakpoint
CREATE INDEX "visit_participants_visit_id_idx" ON "visit_participants" USING btree ("visit_id");--> statement-breakpoint
CREATE INDEX "visit_status_history_visit_idx" ON "visit_status_history" USING btree ("visit_id","created_at");--> statement-breakpoint
ALTER TABLE "visit_participants" ADD CONSTRAINT "visit_participants_visit_visitor_unique" UNIQUE("visit_id","visitor_id");