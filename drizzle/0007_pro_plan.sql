-- Free and Pro (docs/SPEC.md section 16): no trial any more, and one paid plan.
-- Everyone who paid for Starter or Growth is on Pro; everyone else is on Free.
UPDATE "billing" SET "plan" = 'pro' WHERE "plan" IS NOT NULL;--> statement-breakpoint
ALTER TABLE "billing" DROP COLUMN "trial_ends_at";
