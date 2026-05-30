import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/types/database'
import { aggregateCustomers, type Customer, type CustomerOrder, type CustomerProfile } from './aggregate'

export async function getCustomers(client: SupabaseClient<Database>): Promise<Customer[]> {
  const [ordersRes, profilesRes] = await Promise.all([
    client.from('orders').select('customer_email, total, status, created_at'),
    client.from('app_users').select('email, role'),
  ])
  if (ordersRes.error) throw new Error(ordersRes.error.message)
  if (profilesRes.error) throw new Error(profilesRes.error.message)

  const orders: CustomerOrder[] = (ordersRes.data ?? []).map((o) => ({
    customer_email: o.customer_email,
    total: Number(o.total),
    status: o.status,
    created_at: o.created_at,
  }))
  const profiles: CustomerProfile[] = (profilesRes.data ?? []).map((p) => ({ email: p.email, role: p.role }))

  return aggregateCustomers(orders, profiles)
    .sort((a, b) => b.totalSpent - a.totalSpent)
}

export async function getCustomerOrders(client: SupabaseClient<Database>, email: string) {
  const { data, error } = await client
    .from('orders')
    .select('id, total, status, created_at')
    .eq('customer_email', email)
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []).map((o) => ({ id: o.id, total: Number(o.total), status: o.status, created_at: o.created_at }))
}
