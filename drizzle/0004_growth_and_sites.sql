-- Sprint 5 (docs/SPEC.md section 28.1): the Growth plan, several sites per account,
-- and one public page per site.
ALTER TABLE "billing" ADD COLUMN "plan" text;--> statement-breakpoint
-- Everyone who paid before Growth existed is on Starter.
UPDATE "billing" SET "plan" = 'starter' WHERE "stripe_subscription_id" IS NOT NULL;--> statement-breakpoint
ALTER TABLE "site" ADD COLUMN "added_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "site" ADD COLUMN "last_viewed_at" timestamp with time zone;--> statement-breakpoint
-- Each user's current site is the one site in their list.
UPDATE "site" SET "added_at" = "created_at" WHERE "is_active";--> statement-breakpoint
CREATE INDEX "site_added_idx" ON "site" USING btree ("user_id","added_at") WHERE "site"."added_at" is not null;--> statement-breakpoint
-- public_page: from one per user to one per site. Each page moves to its owner's active
-- site (the site it showed). A page whose owner had no site never showed anything.
ALTER TABLE "public_page" ADD COLUMN "site_id" text;--> statement-breakpoint
UPDATE "public_page" SET "site_id" = "site"."id" FROM "site" WHERE "site"."user_id" = "public_page"."user_id" AND "site"."is_active";--> statement-breakpoint
DELETE FROM "public_page" WHERE "site_id" IS NULL;--> statement-breakpoint
ALTER TABLE "public_page" ALTER COLUMN "site_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "public_page" DROP CONSTRAINT "public_page_pkey";--> statement-breakpoint
ALTER TABLE "public_page" ADD PRIMARY KEY ("site_id");--> statement-breakpoint
ALTER TABLE "public_page" ADD CONSTRAINT "public_page_site_id_site_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."site"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "public_page_user_idx" ON "public_page" USING btree ("user_id");
