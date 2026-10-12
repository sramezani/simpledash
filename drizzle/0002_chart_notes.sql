CREATE TABLE "chart_note" (
	"id" text PRIMARY KEY NOT NULL,
	"site_id" text NOT NULL,
	"day" date NOT NULL,
	"text" varchar(80) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "chart_note" ADD CONSTRAINT "chart_note_site_id_site_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."site"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "chart_note_site_day_idx" ON "chart_note" USING btree ("site_id","day");