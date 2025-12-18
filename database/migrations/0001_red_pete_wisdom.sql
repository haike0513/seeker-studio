CREATE TABLE "file_attachment" (
	"id" text PRIMARY KEY NOT NULL,
	"message_id" text NOT NULL,
	"file_type" text NOT NULL,
	"mime_type" text NOT NULL,
	"file_name" text NOT NULL,
	"file_size" integer NOT NULL,
	"file_url" text NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "message_reference" (
	"id" text PRIMARY KEY NOT NULL,
	"message_id" text NOT NULL,
	"reference_type" text NOT NULL,
	"target_id" text NOT NULL,
	"preview" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "chat" ADD COLUMN "opener" text;--> statement-breakpoint
ALTER TABLE "chat" ADD COLUMN "enable_suggestions" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "message" ADD COLUMN "metadata" jsonb;--> statement-breakpoint
ALTER TABLE "file_attachment" ADD CONSTRAINT "file_attachment_message_id_message_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."message"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_reference" ADD CONSTRAINT "message_reference_message_id_message_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."message"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "fileAttachment_messageId_idx" ON "file_attachment" USING btree ("message_id");--> statement-breakpoint
CREATE INDEX "messageReference_messageId_idx" ON "message_reference" USING btree ("message_id");--> statement-breakpoint
CREATE INDEX "messageReference_targetId_idx" ON "message_reference" USING btree ("target_id");