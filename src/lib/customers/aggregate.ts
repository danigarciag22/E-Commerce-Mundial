export type CustomerOrder = {
  customer_email: string | null
  total: number
  status: string
  created_at: string
}

export type CustomerProfile = { email: string; role: string }

export type Customer = {
  email: string
  registered: boolean
  role: string | null
  orders: number
  totalSpent: number
  lastOrder: string | null
}

export function aggregateCustomers(orders: CustomerOrder[], profiles: CustomerProfile[]): Customer[] {
  const map = new Map<string, Customer>()

  const ensure = (email: string): Customer => {
    let c = map.get(email)
    if (!c) {
      c = { email, registered: false, role: null, orders: 0, totalSpent: 0, lastOrder: null }
      map.set(email, c)
    }
    return c
  }

  for (const o of orders) {
    if (!o.customer_email) continue
    const c = ensure(o.customer_email)
    c.orders += 1
    if (o.status === 'paid') c.totalSpent += Number(o.total)
    if (!c.lastOrder || o.created_at > c.lastOrder) c.lastOrder = o.created_at
  }

  for (const p of profiles) {
    const c = ensure(p.email)
    c.registered = true
    c.role = p.role
  }

  return [...map.values()]
}
