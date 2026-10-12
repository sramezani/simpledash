CREATE TABLE "billing" (
	"user_id" text PRIMARY KEY NOT NULL,
	"trial_ends_at" timestamp with time zone NOT NULL,
	"status" text,
	"stripe_customer_id" text,
	"stripe_subscription_id" text,
	"plan_interval" text,
	"current_period_end" timestamp with time zone,
	"cancel_at_period_end" boolean DEFAULT false NOT NULL,
	"state_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "billing_stripe_customer_id_unique" UNIQUE("stripe_customer_id")
);
--> statement-breakpoint
CREATE TABLE "email_send" (
	"user_id" text NOT NULL,
	"week_start" date NOT NULL,
	"sent_at" timestamp with time zone DEFAULT now() NOT NULL,
	"provider_message_id" text,
	CONSTRAINT "email_send_user_id_week_start_pk" PRIMARY KEY("user_id","week_start")
);
--> statement-breakpoint
CREATE TABLE "public_page" (
	"user_id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"enabled" boolean DEFAULT false NOT NULL,
	"cards" text[] NOT NULL,
	"indexable" boolean DEFAULT true NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "public_page_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "stripe_event" (
	"event_id" text PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_settings" (
	"user_id" text PRIMARY KEY NOT NULL,
	"weekly_email" boolean DEFAULT true NOT NULL,
	"email_notice_dismissed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "billing" ADD CONSTRAINT "billing_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_send" ADD CONSTRAINT "email_send_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "public_page" ADD CONSTRAINT "public_page_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
-- Users who signed up before billing existed get a 14-day trial from their sign-up date.
INSERT INTO "billing" ("user_id", "trial_ends_at", "updated_at")
SELECT "id", "created_at" + interval '14 days', now() FROM "user"
ON CONFLICT ("user_id") DO NOTHING;
--> statement-breakpoint
INSERT INTO "user_settings" ("user_id") SELECT "id" FROM "user" ON CONFLICT ("user_id") DO NOTHING;
