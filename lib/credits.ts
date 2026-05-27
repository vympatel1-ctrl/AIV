import type { GenerationKind } from "@/types/database";

/**
 * Cost map: how many app-credits each generation costs.
 * Keep these conservative until we benchmark real usage.
 */
export const CREDIT_COSTS = {
  copy: 1,
  image: 5,
  video: 25,
  voiceover: 3,
  flyer: 5,
} as const satisfies Record<GenerationKind, number>;

/**
 * Approximate $-cost per kind. Used by the admin dashboard to surface
 * raw API spend (NOT what we charge users).
 */
export const COST_USD = {
  copy: 0.005,
  image: 0.04,
  video: 0.6,
  voiceover: 0.03,
  flyer: 0.04,
} as const satisfies Record<GenerationKind, number>;

export function creditsFor(kind: GenerationKind, n = 1): number {
  return CREDIT_COSTS[kind] * Math.max(1, n);
}

export function costFor(kind: GenerationKind, n = 1): number {
  return COST_USD[kind] * Math.max(1, n);
}
