import type { CartItem } from './types'

// Automatic cart rewards shown by the post-add promo popup.
//
// Each tier maps a subtotal threshold (COP) to a real discount code. The code
// MUST exist and be active in the `discounts` table — checkout re-validates it
// server-side, so an expired/missing code simply won't apply (no fake money
// off). Owner can edit thresholds/codes here in one place.
export type RewardTier = {
  minSubtotal: number
  percent: number
  code: string
  label: string
}

// Keep ascending by minSubtotal.
export const REWARD_TIERS: RewardTier[] = [
  { minSubtotal: 600_000, percent: 10, code: 'MUNDIAL10', label: '10% OFF' },
  { minSubtotal: 1_000_000, percent: 20, code: 'HINCHA20', label: '20% OFF' },
]

export function subtotalOf(items: CartItem[]): number {
  return items.reduce((n, i) => n + i.price * i.quantity, 0)
}

/** Highest tier already unlocked by the current subtotal (or null). */
export function unlockedTier(subtotal: number): RewardTier | null {
  let best: RewardTier | null = null
  for (const t of REWARD_TIERS) {
    if (subtotal >= t.minSubtotal) best = t
  }
  return best
}

/** Next tier not yet reached (or null when everything is unlocked). */
export function nextTier(subtotal: number): RewardTier | null {
  for (const t of REWARD_TIERS) {
    if (subtotal < t.minSubtotal) return t
  }
  return null
}

/** Pesos still needed to reach the next tier (0 if none left). */
export function amountToNext(subtotal: number): number {
  const t = nextTier(subtotal)
  return t ? Math.max(0, t.minSubtotal - subtotal) : 0
}

/** Progress 0..1 toward the next tier, measured from the previous tier floor. */
export function progressToNext(subtotal: number): number {
  const next = nextTier(subtotal)
  if (!next) return 1
  const prevFloor = unlockedTier(subtotal)?.minSubtotal ?? 0
  const span = next.minSubtotal - prevFloor
  if (span <= 0) return 1
  return Math.min(1, Math.max(0, (subtotal - prevFloor) / span))
}
