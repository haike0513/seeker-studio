CREATE TABLE "document" (
	"id" text PRIMARY KEY NOT NULL,
	"knowledge_base_id" text NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"file_url" text,
	"content" text,
	"metadata" jsonb,
	"size" integer,
	"status" text DEFAULT 'processing',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "document_segment" (
	"id" text PRIMARY KEY NOT NULL,
	"document_id" text NOT NULL,
	"content" text NOT NULL,
	"position" integer,
	"length" integer,
	"embedding" vector(1536),
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "knowledge_base" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"embedding_model" text DEFAULT 'text-embedding-3-small',
	"indexing_method" text DEFAULT 'vector',
	"retrieval_config" jsonb,
	"enabled" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "document" ADD CONSTRAINT "document_knowledge_base_id_knowledge_base_id_fk" FOREIGN KEY ("knowledge_base_id") REFERENCES "public"."knowledge_base"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_segment" ADD CONSTRAINT "document_segment_document_id_document_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."document"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_base" ADD CONSTRAINT "knowledge_base_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;