ALTER TABLE "departments" ADD COLUMN "abbreviation" text;--> statement-breakpoint
ALTER TABLE "services" ADD COLUMN "department_id" uuid;