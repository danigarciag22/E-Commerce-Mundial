import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/types/database'
import type { OrderRow, OrderItem } from './types'

export async function getOrderById(client: SupabaseClient<Database>, id: string): Promise<OrderRow | null> {
  const { data, error } = await client
    .from('orders')
    .select('id, customer_email, total, status, created_at, items')
    .eq('id', id)
    .maybeSingle()
  if (error) throw new Error(error.message)
  if (!data) return null
  return {
    id: data.id,
    customer_email: data.customer_email,
    total: Number(data.total),
    status: data.status,
    created_at: data.created_at,
    items: Array.isArray(data.items) ? (data.items as unknown as OrderItem[]) : [],
  }
}
