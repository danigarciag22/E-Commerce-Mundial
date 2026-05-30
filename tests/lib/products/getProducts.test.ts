import { describe, it, expect } from 'vitest'
import { getProducts } from '@/lib/products/getProducts'

function fakeClient(rows: unknown[]) {
  const calls: { method: string; args: unknown[] }[] = []
  const builder: Record<string, unknown> = {}
  for (const m of ['select', 'eq', 'gte', 'lte', 'order']) {
    builder[m] = (...args: unknown[]) => { calls.push({ method: m, args }); return builder }
  }
  ;(builder as { then: unknown }).then = (resolve: (v: unknown) => void) =>
    resolve({ data: rows, error: null })
  const client = { from: () => builder, __calls: calls } as never
  return client
}

describe('getProducts filters', () => {
  it('applies category filter via eq', async () => {
    const client = fakeClient([])
    await getProducts(client, { category: 'balon' })
    expect((client as never as { __calls: { method: string; args: unknown[] }[] }).__calls)
      .toContainEqual({ method: 'eq', args: ['category', 'balon'] })
  })

  it('applies price range via gte/lte', async () => {
    const client = fakeClient([])
    await getProducts(client, { minPrice: 100, maxPrice: 500 })
    const calls = (client as never as { __calls: { method: string; args: unknown[] }[] }).__calls
    expect(calls).toContainEqual({ method: 'gte', args: ['price', 100] })
    expect(calls).toContainEqual({ method: 'lte', args: ['price', 500] })
  })

  it('maps rows and coerces price to number', async () => {
    const client = fakeClient([
      { id: '1', name: 'Balón', sku: 'B-1', price: '50.00', description: null, category: 'balon', stock: '5', active: true, created_at: 'x' },
    ])
    const result = await getProducts(client)
    expect(result).toEqual([
      { id: '1', name: 'Balón', sku: 'B-1', price: 50, description: null, category: 'balon', stock: 5, active: true },
    ])
  })
})
