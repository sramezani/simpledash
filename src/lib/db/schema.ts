/**
 * The database schema (docs/SPEC.md section 9). IDs are text, Better Auth style,
 * and every user_id foreign key cascades on delete. No table holds visitor-level data.
 */

// Better Auth tables: generated with `npx auth generate` (the Better Auth CLI),
// with timestamps switched to timestamptz. `account` holds the encrypted Google tokens.
import { relations, sql } from "drizzle-orm";
import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [index("session_userId_idx").on(table.userId)],
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("account_userId_idx").on(table.userId)],
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
);

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  sites: many(site),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

// ── Sites and the report cache (Sprint 1) ──────────────────────────────

/**
 * A GA4 property connected by a user. `added_at` set means the site is in the user's
 * list (no limit, on any plan); `is_active` is the one the dashboard opens with.
 * Rows that left the list keep their notes and settings, so adding the site again restores them.
 */
export const site = pgTable(
  "site",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    propertyId: text("property_id").notNull(), // e.g. properties/123456
    isActive: boolean("is_active").default(false).notNull(),
    displayName: text("display_name").notNull(),
    domain: text("domain"),
    timeZone: text("time_zone").notNull(),
    currencyCode: text("currency_code").notNull(),
    serviceLevel: text("service_level").notNull(),
    propertyCreatedAt: timestamp("property_created_at", { withTimezone: true }),
    signupEvent: text("signup_event"),
    status: text("status", { enum: ["ok", "needs_reconnect", "no_access"] })
      .default("ok")
      .notNull(),
    quotaBlockedUntil: timestamp("quota_blocked_until", { withTimezone: true }),
    /** In the user's list since; null when it isn't (switched away from, or removed). */
    addedAt: timestamp("added_at", { withTimezone: true }),
    /** When its dashboard was last opened (stamped at most hourly), for warm-cache. */
    lastViewedAt: timestamp("last_viewed_at", { withTimezone: true }),
    /** The Search Console property for Google search insights (Pro), e.g. sc-domain:example.com. */
    searchConsoleUrl: text("search_console_url"),
    /** Extra spellings of the site's name, for "Your name vs others" (at most 10). */
    brandTerms: text("brand_terms")
      .array()
      .default(sql`'{}'::text[]`)
      .notNull(),
    /** What counts as a sale (Pro): a GA4 key event, or a "thank you" page path. */
    saleEvent: text("sale_event"),
    salePage: text("sale_page"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("site_user_property_idx").on(table.userId, table.propertyId),
    uniqueIndex("site_one_active_per_user_idx")
      .on(table.userId)
      .where(sql`${table.isActive}`),
    index("site_property_idx").on(table.propertyId),
    index("site_added_idx")
      .on(table.userId, table.addedAt)
      .where(sql`${table.addedAt} is not null`),
  ],
);

/**
 * Aggregated GA4 reports, shared per property, never per viewer. One row per
 * report, range and extra inputs, always holding the newest fetch. Never visitor-level data.
 */
export const reportCache = pgTable(
  "report_cache",
  {
    propertyId: text("property_id").notNull(),
    report: text("report").notNull(),
    rangeType: text("range_type").notNull(),
    paramsHash: text("params_hash").notNull(),
    windowStart: date("window_start").notNull(),
    windowEnd: date("window_end").notNull(),
    payload: jsonb("payload").notNull(),
    fetchedAt: timestamp("fetched_at", { withTimezone: true }).notNull(),
    refreshingUntil: timestamp("refreshing_until", { withTimezone: true }),
    lastError: text("last_error"),
  },
  (table) => [
    primaryKey({ columns: [table.propertyId, table.report, table.rangeType, table.paramsHash] }),
    index("report_cache_fetched_at_idx").on(table.fetchedAt),
  ],
);

export const siteRelations = relations(site, ({ one }) => ({
  user: one(user, { fields: [site.userId], references: [user.id] }),
}));

export type Site = typeof site.$inferSelect;
export type ReportCacheRow = typeof reportCache.$inferSelect;

// ── Chart notes (Sprint 3) ──────────────────────────────────────────────

/** A note on the visitors chart, e.g. "Launched on Product Hunt". Never sent to GA4, never public. */
export const chartNote = pgTable(
  "chart_note",
  {
    id: text("id").primaryKey(),
    siteId: text("site_id")
      .notNull()
      .references(() => site.id, { onDelete: "cascade" }),
    day: date("day").notNull(),
    text: varchar("text", { length: 80 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("chart_note_site_day_idx").on(table.siteId, table.day)],
);

export type ChartNote = typeof chartNote.$inferSelect;

// ── Email, public page and billing (Sprint 4) ───────────────────────────

/** Per-user settings. Created with the user (a database hook) and on first use. */
export const userSettings = pgTable("user_settings", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  weeklyEmail: boolean("weekly_email").default(true).notNull(),
  emailNoticeDismissed: boolean("email_notice_dismissed").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

/** The optional public stats page of one site, /p/<slug>. */
export const publicPage = pgTable(
  "public_page",
  {
    siteId: text("site_id")
      .primaryKey()
      .references(() => site.id, { onDelete: "cascade" }),
    /** The site's owner, kept for clean-up (disconnect, delete account). */
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    slug: text("slug").notNull().unique(),
    enabled: boolean("enabled").default(false).notNull(),
    cards: text("cards").array().notNull(),
    indexable: boolean("indexable").default(true).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("public_page_user_idx").on(table.userId)],
);

/** Free unless Stripe says otherwise; Stripe is only involved once someone upgrades to Pro. */
export const billing = pgTable("billing", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  /** The Stripe subscription status, or null on Free before the first upgrade. */
  status: text("status"),
  /** Which paid plan the subscription is for, from its price (the webhook). Null before the first payment. */
  plan: text("plan", { enum: ["pro"] }),
  stripeCustomerId: text("stripe_customer_id").unique(),
  stripeSubscriptionId: text("stripe_subscription_id"),
  planInterval: text("plan_interval", { enum: ["month", "year"] }),
  currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false).notNull(),
  /** When the subscription state we hold was true at Stripe, so older events can't overwrite it. */
  stateAt: timestamp("state_at", { withTimezone: true }),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

/** One row per weekly email sent: the key makes a second send in the same week impossible. */
export const emailSend = pgTable(
  "email_send",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    weekStart: date("week_start").notNull(),
    sentAt: timestamp("sent_at", { withTimezone: true }).defaultNow().notNull(),
    providerMessageId: text("provider_message_id"),
  },
  (table) => [primaryKey({ columns: [table.userId, table.weekStart] })],
);

/** Stripe events already handled, so a repeated delivery is skipped. */
export const stripeEvent = pgTable("stripe_event", {
  eventId: text("event_id").primaryKey(),
  type: text("type").notNull(),
  receivedAt: timestamp("received_at", { withTimezone: true }).defaultNow().notNull(),
});

// ── Revenue from Stripe (Sprint 7) ──────────────────────────────────────

/**
 * A site's read-only Stripe connection: a pasted restricted key, encrypted like the
 * Google tokens. Only its last 4 characters are ever shown again.
 */
export const revenueSource = pgTable("revenue_source", {
  siteId: text("site_id")
    .primaryKey()
    .references(() => site.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  /** The key, encrypted. */
  secret: text("secret").notNull(),
  /** Its last 4 characters, to recognise it. */
  keyHint: text("key_hint").notNull(),
  livemode: boolean("livemode").notNull(),
  status: text("status", { enum: ["ok", "invalid"] })
    .default("ok")
    .notNull(),
  /** The first day the totals cover (the backfill reaches back to it). */
  coversFrom: date("covers_from"),
  lastSyncAt: timestamp("last_sync_at", { withTimezone: true }),
  lastError: text("last_error"),
  /** Subscriptions with usage-based prices, which MRR can't count. */
  mrrLeftOut: integer("mrr_left_out").default(0).notNull(),
  connectedAt: timestamp("connected_at", { withTimezone: true }).defaultNow().notNull(),
});

/**
 * Daily totals from Stripe for one site, in the site's time zone. Amounts are in each
 * currency's smallest unit. Never customer names, emails, card or customer IDs.
 */
export const revenueDay = pgTable(
  "revenue_day",
  {
    siteId: text("site_id")
      .notNull()
      .references(() => site.id, { onDelete: "cascade" }),
    day: date("day").notNull(),
    /** { EUR: { charged, refunded } }: money that day, per currency. */
    money: jsonb("money").$type<Record<string, { charged: number; refunded: number }>>().notNull(),
    newCustomers: integer("new_customers").default(0).notNull(),
    /** Monthly recurring revenue per currency, on the days it was recorded. */
    mrr: jsonb("mrr").$type<Record<string, number>>(),
  },
  (table) => [primaryKey({ columns: [table.siteId, table.day] })],
);

export type RevenueSource = typeof revenueSource.$inferSelect;
export type RevenueDay = typeof revenueDay.$inferSelect;

export type Billing = typeof billing.$inferSelect;
export type PublicPage = typeof publicPage.$inferSelect;
export type UserSettings = typeof userSettings.$inferSelect;
