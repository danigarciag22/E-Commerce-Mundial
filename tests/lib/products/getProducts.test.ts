import { describe, it, expect } from 'vitest'
import { getProducts } from '@/lib/products/getProducts'

function fakeClient(rows: unknown[]) {
  return {
    from() {
      return { select() { return Promise.resolve({ data: rows, error: null }) } }
    },
  } as never
}

describe('getProducts', () => {
  it('maps rows to Product objects', async () => {
    const client = fakeClient([
      { id: '1', name: 'Balón', sku: 'B-1', price: '50.00', description: null, category: 'balon', created_at: 'x' },
    ])
    const result = await getProducts(client)
    expect(result).toEqual([
      { id: '1', name: 'Balón', sku: 'B-1', price: 50, description: null, category: 'balon' },
    ])
  })

  it('returns empty array when there are no rows', async () => {
    const result = await getProducts(fakeClient([]))
    expect(result).toEqual([])
  })
})
