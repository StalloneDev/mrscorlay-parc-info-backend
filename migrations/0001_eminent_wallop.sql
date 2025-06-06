CREATE TABLE "activities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"status" text NOT NULL,
	"entity_id" uuid NOT NULL,
	"entity_type" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
