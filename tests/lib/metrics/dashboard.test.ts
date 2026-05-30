import { describe, it, expect } from 'vitest'
import { summarize, type OrderRow } from '@/lib/metrics/dashboard'

const orders: OrderRow[] = [
  { total: 100, status: 'paid', created_at: '2026-01-01T00:00:00Z', customer_email: 'a@x.com',
    items: [{ id: 'p1', name: 'Balón', price: 50, category: 'balon', quantity: 2 }] },
  { total: 200, status: 'paid', created_at: '2026-01-01T05:00:00Z', customer_email: 'b@x.com',
    items: [{ id: 'p2', name: 'Gorra', price: 200, category: 'merchandising', quantity: 1 }] },
  { total: 999, status: 'pending', created_at: '2026-01-02T00:00:00Z', customer_email: 'a@x.com',
    items: [{ id: 'p1', name: 'Balón', price: 50, category: 'balon', quantity: 1 }] },
]

describe('summarize', () => {
  it('computes KPIs from paid orders', () => {
    const s = summarize(orders)
    expect(s.revenue).toBe(300)
    expect(s.paidOrders).toBe(2)
    expect(s.avgTicket).toBe(150)
    expect(s.customers).toBe(2)
  })
  it('groups orders by status', () => {
    const s = summarize(orders)
    expect(s.byStatus).toEqual(expect.arrayContaining([
      { status: 'paid', count: 2 }, { status: 'pending', count: 1 },
    ]))
  })
  it('sums sales by day (paid only)', () => {
    expect(summarize(orders).salesByDay).toEqual([{ date: '2026-01-01', total: 300 }])
  })
  it('ranks top products by quantity (paid only)', () => {
    const s = summarize(orders)
    expect(s.topProducts[0]).toEqual({ name: 'Balón', quantity: 2 })
    expect(s.topProducts[1]).toEqual({ name: 'Gorra', quantity: 1 })
  })
  it('handles empty input', () => {
    expect(summarize([])).toEqual({ revenue: 0, paidOrders: 0, avgTicket: 0, customers: 0, byStatus: [], salesByDay: [], topProducts: [] })
  })
})
