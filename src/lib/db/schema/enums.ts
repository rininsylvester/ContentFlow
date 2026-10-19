import { pgEnum } from "drizzle-orm/pg-core";

export const TOOLS = ["ideas", "script", "hooks", "seo", "aesthetics", "repurpose"] as const;
export type Tool = (typeof TOOLS)[number];

export const SUBSCRIPTION_STATUSES = [
  "none",
  "active",
  "past_due",
  "canceled",
  "unpaid",
  "incomplete",
] as const;
export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number];

export const CALENDAR_STATUSES = ["idea", "scripted", "filmed", "posted"] as const;
export type CalendarStatus = (typeof CALENDAR_STATUSES)[number];

export const toolEnum = pgEnum("tool", TOOLS);
export const subscriptionStatusEnum = pgEnum("subscription_status", SUBSCRIPTION_STATUSES);
export const generationStatusEnum = pgEnum("generation_status", ["pending", "succeeded", "failed"]);
export const billedAsEnum = pgEnum("billed_as", ["trial", "subscription", "none"]);
export const calendarStatusEnum = pgEnum("calendar_status", CALENDAR_STATUSES);
