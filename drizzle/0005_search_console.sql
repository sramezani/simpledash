-- Sprint 6 (docs/SPEC.md section 28.2): the Search Console property and name spellings per site.
ALTER TABLE "site" ADD COLUMN "search_console_url" text;--> statement-breakpoint
ALTER TABLE "site" ADD COLUMN "brand_terms" text[] DEFAULT '{}'::text[] NOT NULL;