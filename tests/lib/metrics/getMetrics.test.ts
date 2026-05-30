import { describe, it, expect } from 'vitest'
import { getMetrics } from '@/lib/metrics/getMetrics'

function fakeClient() {
  return {
    from(table: string) {
      if (table === 'orders') {
        return {
          select: () => Promise.resolve({
            data: [
              { status: 'paid', total: 100 },
              { status: 'paid', total: 250 },
              { status: 'pending', total: 999 },
            ],
            error: null,
          }),
        }
      }
      return { select: () => Promise.resolve({ count: 12, error: null }) }
    },
  } as never
}

describe('getMetrics', () => {
  it('sums revenue from paid orders only and counts products', async () => {
    const m = await getMetrics(fakeClient())
    expect(m.revenue).toBe(350)
    expect(m.paidOrders).toBe(2)
    expect(m.totalProducts).toBe(12)
  })
})
