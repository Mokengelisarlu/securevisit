ALTER TABLE "hosts" RENAME COLUMN "full_name" TO "first_name";--> statement-breakpoint
ALTER TABLE "hosts" ADD COLUMN "last_name" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "hosts" ADD COLUMN "middle_name" text;--> statement-breakpoint
ALTER TABLE "hosts" ADD COLUMN "photo_url" text;