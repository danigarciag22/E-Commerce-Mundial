import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/types/database'
import type { OrderRow, OrderItem } from './types'

export async function getOrders(client: SupabaseClient<Database>): Promise<OrderRow[]> {
  const { data, error } = await client
    .from('orders')
    .select('id, customer_email, total, status, created_at, items')
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []).map((o) => ({
    id: o.id,
    customer_email: o.customer_email,
    total: Number(o.total),
    status: o.status,
    created_at: o.created_at,
    items: Array.isArray(o.items) ? (o.items as unknown as OrderItem[]) : [],
  }))
}
