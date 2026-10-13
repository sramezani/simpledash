-- Sprint 7 (docs/SPEC.md section 28.3): a read-only Stripe connection per site with daily
-- totals only, and what counts as a sale.
CREATE TABLE "revenue_day" (
	"site_id" text NOT NULL,
	"day" date NOT NULL,
	"money" jsonb NOT NULL,
	"new_customers" integer DEFAULT 0 NOT NULL,
	"mrr" jsonb,
	CONSTRAINT "revenue_day_site_id_day_pk" PRIMARY KEY("site_id","day")
);
--> statement-breakpoint
CREATE TABLE "revenue_source" (
	"site_id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"secret" text NOT NULL,
	"key_hint" text NOT NULL,
	"livemode" boolean NOT NULL,
	"status" text DEFAULT 'ok' NOT NULL,
	"covers_from" date,
	"last_sync_at" timestamp with time zone,
	"last_error" text,
	"mrr_left_out" integer DEFAULT 0 NOT NULL,
	"connected_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "site" ADD COLUMN "sale_event" text;--> statement-breakpoint
ALTER TABLE "site" ADD COLUMN "sale_page" text;--> statement-breakpoint
ALTER TABLE "revenue_day" ADD CONSTRAINT "revenue_day_site_id_site_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."site"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "revenue_source" ADD CONSTRAINT "revenue_source_site_id_site_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."site"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "revenue_source" ADD CONSTRAINT "revenue_source_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;