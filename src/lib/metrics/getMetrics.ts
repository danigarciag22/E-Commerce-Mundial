import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/types/database'

export type Metrics = { revenue: number; paidOrders: number; totalProducts: number }

export async function getMetrics(client: SupabaseClient<Database>): Promise<Metrics> {
  const { data: orders, error: ordersError } = await client.from('orders').select('status, total')
  if (ordersError) throw new Error(ordersError.message)
  const paid = (orders ?? []).filter((o) => o.status === 'paid')
  const revenue = paid.reduce((sum, o) => sum + Number(o.total), 0)
  const { count, error: countError } = await client.from('products').select('*', { count: 'exact', head: true })
  if (countError) throw new Error(countError.message)
  return { revenue, paidOrders: paid.length, totalProducts: count ?? 0 }
}
