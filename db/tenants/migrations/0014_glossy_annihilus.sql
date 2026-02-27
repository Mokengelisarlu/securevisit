ALTER TABLE "settings" ADD COLUMN "require_visitor_photo" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "require_vehicle_photo" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "visits" ADD COLUMN "visitor_photo_url" text;--> statement-breakpoint
ALTER TABLE "visits" ADD COLUMN "vehicle_photo_url" text;