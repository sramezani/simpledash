CREATE TABLE "report_cache" (
	"property_id" text NOT NULL,
	"report" text NOT NULL,
	"range_type" text NOT NULL,
	"params_hash" text NOT NULL,
	"window_start" date NOT NULL,
	"window_end" date NOT NULL,
	"payload" jsonb NOT NULL,
	"fetched_at" timestamp with time zone NOT NULL,
	"refreshing_until" timestamp with time zone,
	"last_error" text,
	CONSTRAINT "report_cache_property_id_report_range_type_params_hash_pk" PRIMARY KEY("property_id","report","range_type","params_hash")
);
--> statement-breakpoint
CREATE TABLE "site" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"property_id" text NOT NULL,
	"is_active" boolean DEFAULT false NOT NULL,
	"display_name" text NOT NULL,
	"domain" text,
	"time_zone" text NOT NULL,
	"currency_code" text NOT NULL,
	"service_level" text NOT NULL,
	"property_created_at" timestamp with time zone,
	"signup_event" text,
	"status" text DEFAULT 'ok' NOT NULL,
	"quota_blocked_until" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "site" ADD CONSTRAINT "site_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "report_cache_fetched_at_idx" ON "report_cache" USING btree ("fetched_at");--> statement-breakpoint
CREATE UNIQUE INDEX "site_user_property_idx" ON "site" USING btree ("user_id","property_id");--> statement-breakpoint
CREATE UNIQUE INDEX "site_one_active_per_user_idx" ON "site" USING btree ("user_id") WHERE "site"."is_active";--> statement-breakpoint
CREATE INDEX "site_property_idx" ON "site" USING btree ("property_id");