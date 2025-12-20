ALTER TABLE "whiteboard" ADD COLUMN "metadata" jsonb;--> statement-breakpoint
ALTER TABLE "whiteboard" ADD COLUMN "background_color" text;--> statement-breakpoint
ALTER TABLE "whiteboard" ADD COLUMN "is_public" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "whiteboard" ADD COLUMN "share_token" text;--> statement-breakpoint
ALTER TABLE "whiteboard" ADD COLUMN "view_state" jsonb;--> statement-breakpoint
CREATE INDEX "whiteboard_shareToken_idx" ON "whiteboard" USING btree ("share_token");