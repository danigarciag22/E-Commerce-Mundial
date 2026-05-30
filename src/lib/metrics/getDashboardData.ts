import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/types/database'
import { summarize, type DashboardData, type OrderRow, type OrderItem } from './dashboard'

export async function getDashboardData(
  client: SupabaseClient<Database>,
  days: number,
): Promise<DashboardData> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
  const { data, error } = await client
    .from('orders')
    .select('total, status, created_at, customer_email, items')
    .gte('created_at', since)
  if (error) throw new Error(error.message)

  const rows: OrderRow[] = (data ?? []).map((o) => ({
    total: Number(o.total),
    status: o.status,
    created_at: o.created_at,
    customer_email: o.customer_email,
    items: Array.isArray(o.items) ? (o.items as unknown as OrderItem[]) : [],
  }))
  return summarize(rows)
}
