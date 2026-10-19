CREATE TYPE "public"."billed_as" AS ENUM('trial', 'subscription', 'none');--> statement-breakpoint
CREATE TYPE "public"."calendar_status" AS ENUM('idea', 'scripted', 'filmed', 'posted');--> statement-breakpoint
CREATE TYPE "public"."generation_status" AS ENUM('pending', 'succeeded', 'failed');--> statement-breakpoint
CREATE TYPE "public"."subscription_status" AS ENUM('none', 'active', 'past_due', 'canceled', 'unpaid', 'incomplete');--> statement-breakpoint
CREATE TYPE "public"."tool" AS ENUM('ideas', 'script', 'hooks', 'seo', 'aesthetics', 'repurpose');--> statement-breakpoint
CREATE TABLE "brand_profiles" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"niche" text,
	"audience" text,
	"tone" text,
	"words_to_use" text[] DEFAULT '{}' NOT NULL,
	"words_to_avoid" text[] DEFAULT '{}' NOT NULL,
	"example_content" text,
	"platforms" text[] DEFAULT '{}' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "brand_profiles" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"display_name" text,
	"avatar_url" text,
	"onboarded_at" timestamp with time zone,
	"trial_generations_used" integer DEFAULT 0 NOT NULL,
	"stripe_customer_id" text,
	"stripe_subscription_id" text,
	"subscription_status" "subscription_status" DEFAULT 'none' NOT NULL,
	"cancel_at_period_end" boolean DEFAULT false NOT NULL,
	"current_period_start" timestamp with time zone,
	"current_period_end" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_stripe_customer_id_unique" UNIQUE("stripe_customer_id"),
	CONSTRAINT "users_stripe_subscription_id_unique" UNIQUE("stripe_subscription_id")
);
--> statement-breakpoint
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "calendar_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"saved_item_id" uuid,
	"title" text NOT NULL,
	"scheduled_date" date NOT NULL,
	"platform" text,
	"status" "calendar_status" DEFAULT 'idea' NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "calendar_entries" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "generations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"tool" "tool" NOT NULL,
	"input" jsonb NOT NULL,
	"output" jsonb,
	"status" "generation_status" DEFAULT 'pending' NOT NULL,
	"error_code" text,
	"parent_id" uuid,
	"model" text NOT NULL,
	"prompt_version" text NOT NULL,
	"brand_voice_applied" boolean DEFAULT false NOT NULL,
	"input_tokens" integer DEFAULT 0 NOT NULL,
	"output_tokens" integer DEFAULT 0 NOT NULL,
	"cost_usd_micros" integer DEFAULT 0 NOT NULL,
	"latency_ms" integer,
	"billed_as" "billed_as" DEFAULT 'none' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "generations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "saved_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"generation_id" uuid,
	"tool" "tool" NOT NULL,
	"title" text NOT NULL,
	"content" jsonb NOT NULL,
	"tags" text[] DEFAULT '{}' NOT NULL,
	"is_favorite" boolean DEFAULT false NOT NULL,
	"search" "tsvector" GENERATED ALWAYS AS (setweight(to_tsvector('english'::regconfig, coalesce(title, '')), 'A') || setweight(jsonb_to_tsvector('english'::regconfig, content, '["string"]'::jsonb), 'B')) STORED,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "saved_items" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "rate_limits" (
	"user_id" uuid NOT NULL,
	"window_start" timestamp with time zone NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "rate_limits_user_id_window_start_pk" PRIMARY KEY("user_id","window_start")
);
--> statement-breakpoint
ALTER TABLE "rate_limits" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "stripe_events" (
	"id" text PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"processed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "stripe_events" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "usage_periods" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"period_start" timestamp with time zone NOT NULL,
	"period_end" timestamp with time zone NOT NULL,
	"generations_used" integer DEFAULT 0 NOT NULL,
	"generation_cap" integer NOT NULL,
	"input_tokens" integer DEFAULT 0 NOT NULL,
	"output_tokens" integer DEFAULT 0 NOT NULL,
	"cost_usd_micros" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "usage_periods_user_period_key" UNIQUE("user_id","period_start")
);
--> statement-breakpoint
ALTER TABLE "usage_periods" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "brand_profiles" ADD CONSTRAINT "brand_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_id_users_id_fk" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calendar_entries" ADD CONSTRAINT "calendar_entries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calendar_entries" ADD CONSTRAINT "calendar_entries_saved_item_id_saved_items_id_fk" FOREIGN KEY ("saved_item_id") REFERENCES "public"."saved_items"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "generations" ADD CONSTRAINT "generations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "generations" ADD CONSTRAINT "generations_parent_id_generations_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."generations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_items" ADD CONSTRAINT "saved_items_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_items" ADD CONSTRAINT "saved_items_generation_id_generations_id_fk" FOREIGN KEY ("generation_id") REFERENCES "public"."generations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rate_limits" ADD CONSTRAINT "rate_limits_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usage_periods" ADD CONSTRAINT "usage_periods_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "calendar_entries_user_date_idx" ON "calendar_entries" USING btree ("user_id","scheduled_date");--> statement-breakpoint
CREATE INDEX "generations_user_created_idx" ON "generations" USING btree ("user_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "saved_items_user_created_idx" ON "saved_items" USING btree ("user_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "saved_items_search_idx" ON "saved_items" USING gin ("search");--> statement-breakpoint
CREATE INDEX "saved_items_tags_idx" ON "saved_items" USING gin ("tags");--> statement-breakpoint
CREATE POLICY "brand_profiles_owner_all" ON "brand_profiles" AS PERMISSIVE FOR ALL TO "authenticated" USING ("brand_profiles"."user_id" = (select auth.uid())) WITH CHECK ("brand_profiles"."user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "users_owner_select" ON "users" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("users"."id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "calendar_entries_owner_all" ON "calendar_entries" AS PERMISSIVE FOR ALL TO "authenticated" USING ("calendar_entries"."user_id" = (select auth.uid())) WITH CHECK ("calendar_entries"."user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "generations_owner_select" ON "generations" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("generations"."user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "saved_items_owner_all" ON "saved_items" AS PERMISSIVE FOR ALL TO "authenticated" USING ("saved_items"."user_id" = (select auth.uid())) WITH CHECK ("saved_items"."user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "usage_periods_owner_select" ON "usage_periods" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("usage_periods"."user_id" = (select auth.uid()));