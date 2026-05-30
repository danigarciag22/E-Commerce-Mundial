import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/types/database'

export type Discount = { id: string; code: string; percent: number; active: boolean; expires_at: string | null }

export async function getDiscounts(client: SupabaseClient<Database>): Promise<Discount[]> {
  const { data, error } = await client.from('discounts').select('id, code, percent, active, expires_at').order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []).map((d) => ({ id: d.id, code: d.code, percent: d.percent, active: d.active, expires_at: d.expires_at }))
}
