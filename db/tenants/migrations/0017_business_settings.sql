CREATE TABLE "business_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text,
	"logo_url" text,
	"phone" text,
	"email" text,
	"website" text,
	"address" text,
	"city" text,
	"country" text,
	"industry" text,
	"tax_id" text,
	"updated_at" timestamp DEFAULT now()
);
