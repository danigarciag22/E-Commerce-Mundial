import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/types/database'
import type { CartItem } from '@/lib/cart/types'

export type CreateOrderInput = {
  paymentIntentId: string
  total: number
  items: CartItem[]
  status: 'pending' | 'paid'
}

export async function createOrder(
  client: SupabaseClient<Database>,
  input: CreateOrderInput,
): Promise<void> {
  const { error } = await client.from('orders').insert({
    payment_intent_id: input.paymentIntentId,
    total: input.total,
    status: input.status,
    user_id: null,
    items: input.items,
  })
  if (error) throw new Error(error.message)
}
