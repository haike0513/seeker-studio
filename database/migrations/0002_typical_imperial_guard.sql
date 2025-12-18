CREATE TABLE "workflow" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"config" jsonb,
	"enabled" boolean DEFAULT true,
	"is_public" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workflow_edge" (
	"id" text PRIMARY KEY NOT NULL,
	"workflow_id" text NOT NULL,
	"source" text NOT NULL,
	"target" text NOT NULL,
	"source_handle" text,
	"target_handle" text,
	"config" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workflow_execution" (
	"id" text PRIMARY KEY NOT NULL,
	"workflow_id" text NOT NULL,
	"user_id" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"input" jsonb,
	"output" jsonb,
	"error" text,
	"started_at" timestamp,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workflow_node" (
	"id" text PRIMARY KEY NOT NULL,
	"workflow_id" text NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"position" jsonb NOT NULL,
	"config" jsonb,
	"data" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workflow_node_execution" (
	"id" text PRIMARY KEY NOT NULL,
	"execution_id" text NOT NULL,
	"node_id" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"input" jsonb,
	"output" jsonb,
	"error" text,
	"started_at" timestamp,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "workflow" ADD CONSTRAINT "workflow_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_edge" ADD CONSTRAINT "workflow_edge_workflow_id_workflow_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "public"."workflow"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_edge" ADD CONSTRAINT "workflow_edge_source_workflow_node_id_fk" FOREIGN KEY ("source") REFERENCES "public"."workflow_node"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_edge" ADD CONSTRAINT "workflow_edge_target_workflow_node_id_fk" FOREIGN KEY ("target") REFERENCES "public"."workflow_node"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_execution" ADD CONSTRAINT "workflow_execution_workflow_id_workflow_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "public"."workflow"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_execution" ADD CONSTRAINT "workflow_execution_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_node" ADD CONSTRAINT "workflow_node_workflow_id_workflow_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "public"."workflow"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_node_execution" ADD CONSTRAINT "workflow_node_execution_execution_id_workflow_execution_id_fk" FOREIGN KEY ("execution_id") REFERENCES "public"."workflow_execution"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_node_execution" ADD CONSTRAINT "workflow_node_execution_node_id_workflow_node_id_fk" FOREIGN KEY ("node_id") REFERENCES "public"."workflow_node"("id") ON DELETE cascade ON UPDATE no action;