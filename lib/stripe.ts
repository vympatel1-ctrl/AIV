import "server-only";

import Stripe from "stripe";

let _client: Stripe | null = null;

export function getStripe(): Stripe {
  if (_client) return _client;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error(
      "STRIPE_SECRET_KEY is not set — configure it before calling Stripe."
    );
  }
  _client = new Stripe(key, {
    // Pin to the installed SDK's bundled API version so types match the
    // wire protocol. Override at provisioning time if Stripe is rolled
    // back globally.
    apiVersion: "2026-05-27.dahlia",
    typescript: true,
    appInfo: {
      name: "AIV",
      url: process.env.NEXT_PUBLIC_APP_URL,
    },
  });
  return _client;
}

/**
 * One-off credit packs sold via Stripe Checkout (mode: 'payment').
 *
 * `amountCents` is the retail price we display on the billing page; it
 * MUST match the unit amount on the Stripe Price referenced by `priceId`.
 * `credits` is the total credits granted on successful payment (base + bonus).
 *
 * Margin math (raw API cost we anticipate the user spending the credits on
 * at ~10x markup): every 1,000 credits ≈ $0.10 in raw API spend, so a
 * $200 pack granting 25,000 credits costs us ≈ $2.50 of raw API → ~98%
 * margin before bonuses, ~87% after the 25% bonus.
 */
export type PackId = "spark" | "creator" | "studio" | "scale";

export type PackConfig = {
  id: PackId;
  name: string;
  tagline: string;
  amountCents: number;
  credits: number;
  bonusPercent: number; // marketing only — for display
  highlighted?: boolean;
};

export const PACKS: Record<PackId, PackConfig> = {
  spark: {
    id: "spark",
    name: "Spark",
    tagline: "Kick the tires.",
    amountCents: 1000,
    credits: 1000,
    bonusPercent: 0,
  },
  creator: {
    id: "creator",
    name: "Creator",
    tagline: "Ship weekly.",
    amountCents: 2500,
    credits: 2750,
    bonusPercent: 10,
    highlighted: true,
  },
  studio: {
    id: "studio",
    name: "Studio",
    tagline: "Run a feed.",
    amountCents: 7500,
    credits: 9000,
    bonusPercent: 20,
  },
  scale: {
    id: "scale",
    name: "Scale",
    tagline: "Agency mode.",
    amountCents: 20000,
    credits: 25000,
    bonusPercent: 25,
  },
};

export function getPackPriceId(packId: PackId): string {
  const envKey = `STRIPE_PRICE_PACK_${packId.toUpperCase()}`;
  const id = process.env[envKey];
  if (!id) {
    throw new Error(`${envKey} is not set`);
  }
  return id;
}

/**
 * Recurring subscription. Pro = monthly credits + bonus on top-up packs +
 * priority queue metadata. Only one subscription tier on day-one.
 */
export type SubscriptionTier = {
  id: "pro";
  name: string;
  tagline: string;
  amountCents: number;
  monthlyCredits: number;
  packBonusPercent: number;
  perks: string[];
};

export const PRO: SubscriptionTier = {
  id: "pro",
  name: "Pro",
  tagline: "Recurring credits + a 10% top-up bonus.",
  amountCents: 2900,
  monthlyCredits: 3500,
  packBonusPercent: 10,
  perks: [
    "3,500 credits every month",
    "10% bonus on every top-up pack",
    "Priority generation queue",
    "Multiple brand kits",
  ],
};

export function getProPriceId(): string {
  const id = process.env.STRIPE_PRICE_PRO;
  if (!id) throw new Error("STRIPE_PRICE_PRO is not set");
  return id;
}

export function appUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(
    /\/$/,
    ""
  );
}
