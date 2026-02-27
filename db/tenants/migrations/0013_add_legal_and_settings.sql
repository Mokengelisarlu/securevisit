CREATE TYPE "public"."vehicle_type" AS ENUM('CAR', 'TRUCK', 'MOTORCYCLE', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."visit_type" AS ENUM('WALK_IN', 'PRE_REGISTERED');--> statement-breakpoint
CREATE TABLE "vehicles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"plate_number" text NOT NULL,
	"type" "vehicle_type" DEFAULT 'CAR' NOT NULL,
	"brand" text,
	"color" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "visits" ADD COLUMN "vehicle_id" uuid;--> statement-breakpoint
ALTER TABLE "visits" ADD COLUMN "passenger_count" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "visits" ADD COLUMN "visit_type" "visit_type" DEFAULT 'WALK_IN';--> statement-breakpoint
ALTER TABLE "visits" ADD CONSTRAINT "visits_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE no action ON UPDATE no action;