export type OrderItem = { id: string; name: string; price: number; category: string; quantity: number }

export type OrderRow = {
  total: number
  status: string
  created_at: string
  customer_email: string | null
  items: OrderItem[]
}

export type DashboardData = {
  revenue: number
  paidOrders: number
  avgTicket: number
  customers: number
  byStatus: { status: string; count: number }[]
  salesByDay: { date: string; total: number }[]
  topProducts: { name: string; quantity: number }[]
}

export function summarize(orders: OrderRow[]): DashboardData {
  const paid = orders.filter((o) => o.status === 'paid')
  const revenue = paid.reduce((n, o) => n + Number(o.total), 0)
  const paidOrders = paid.length
  const avgTicket = paidOrders > 0 ? Math.round(revenue / paidOrders) : 0

  const emails = new Set(orders.map((o) => o.customer_email).filter(Boolean))
  const customers = emails.size

  const statusMap = new Map<string, number>()
  for (const o of orders) statusMap.set(o.status, (statusMap.get(o.status) ?? 0) + 1)
  const byStatus = [...statusMap.entries()].map(([status, count]) => ({ status, count }))

  const dayMap = new Map<string, number>()
  for (const o of paid) {
    const date = o.created_at.slice(0, 10)
    dayMap.set(date, (dayMap.get(date) ?? 0) + Number(o.total))
  }
  const salesByDay = [...dayMap.entries()]
    .map(([date, total]) => ({ date, total }))
    .sort((a, b) => a.date.localeCompare(b.date))

  const prodMap = new Map<string, number>()
  for (const o of paid) {
    for (const it of o.items ?? []) {
      prodMap.set(it.name, (prodMap.get(it.name) ?? 0) + Number(it.quantity))
    }
  }
  const topProducts = [...prodMap.entries()]
    .map(([name, quantity]) => ({ name, quantity }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5)

  return { revenue, paidOrders, avgTicket, customers, byStatus, salesByDay, topProducts }
}
