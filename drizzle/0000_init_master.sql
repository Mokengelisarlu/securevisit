CREATE TYPE "public"."user_role" AS ENUM('Admin', 'Tenant', 'SUPER');--> statement-breakpoint
CREATE TABLE "tenants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" varchar(100) NOT NULL,
	"db_url" text NOT NULL,
	"owner_id" text NOT NULL,
	"is_active" integer DEFAULT 1,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "tenants_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"role" "user_role" NOT NULL,
	"nom" text,
	"email" text,
	"createdAt" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "tenants" ADD CONSTRAINT "tenants_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;