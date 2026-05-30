export const ORDER_STATUSES = ['pending', 'paid', 'shipped', 'cancelled'] as const
export type OrderStatus = (typeof ORDER_STATUSES)[number]

export type OrderItem = { id: string; name: string; price: number; category: string; quantity: number }

export type OrderRow = {
  id: string
  customer_email: string | null
  total: number
  status: string
  created_at: string
  items: OrderItem[]
}
