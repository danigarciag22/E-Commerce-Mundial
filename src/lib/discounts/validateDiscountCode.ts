import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/types/database'
import { isDiscountUsable } from './discountMath'

export type ValidatedDiscount = { code: string; percent: number } | null

export async function validateDiscountCode(client: SupabaseClient<Database>, rawCode: string): Promise<ValidatedDiscount> {
  const code = rawCode.trim().toUpperCase()
  if (!code) return null
  const { data, error } = await client
    .from('discounts')
    .select('code, percent, active, expires_at')
    .eq('code', code)
    .maybeSingle()
  if (error || !data) return null
  if (!isDiscountUsable({ active: data.active, expires_at: data.expires_at })) return null
  return { code: data.code, percent: data.percent }
}
