import { describe, it, expect } from 'vitest'
import { aggregateCustomers, type CustomerOrder, type CustomerProfile } from '@/lib/customers/aggregate'

const orders: CustomerOrder[] = [
  { customer_email: 'a@x.com', total: 100, status: 'paid', created_at: '2026-01-03T00:00:00Z' },
  { customer_email: 'a@x.com', total: 50, status: 'pending', created_at: '2026-01-05T00:00:00Z' },
  { customer_email: 'b@x.com', total: 200, status: 'paid', created_at: '2026-01-01T00:00:00Z' },
  { customer_email: null, total: 999, status: 'paid', created_at: '2026-01-02T00:00:00Z' },
]
const profiles: CustomerProfile[] = [
  { email: 'a@x.com', role: 'customer' },
  { email: 'admin@x.com', role: 'admin' },
]

describe('aggregateCustomers', () => {
  it('groups orders by email, counts, sums paid spend, tracks last order', () => {
    const list = aggregateCustomers(orders, profiles)
    const a = list.find((c) => c.email === 'a@x.com')!
    expect(a.orders).toBe(2)
    expect(a.totalSpent).toBe(100)        // only paid counts toward spend
    expect(a.lastOrder).toBe('2026-01-05T00:00:00Z')
    expect(a.registered).toBe(true)
    expect(a.role).toBe('customer')
  })
  it('ignores orders with null email', () => {
    const list = aggregateCustomers(orders, profiles)
    expect(list.some((c) => c.email === null)).toBe(false)
  })
  it('includes registered profiles with zero orders', () => {
    const list = aggregateCustomers(orders, profiles)
    const admin = list.find((c) => c.email === 'admin@x.com')!
    expect(admin.orders).toBe(0)
    expect(admin.totalSpent).toBe(0)
    expect(admin.registered).toBe(true)
  })
  it('marks guest customers (orders but no profile) as not registered', () => {
    const list = aggregateCustomers(orders, profiles)
    const b = list.find((c) => c.email === 'b@x.com')!
    expect(b.registered).toBe(false)
    expect(b.role).toBeNull()
  })
})
