import { describe, it, expect } from 'vitest'
import { getProductById } from '@/lib/products/getProductById'

function fakeClient(row: unknown, error: unknown = null) {
  const builder: Record<string, unknown> = {}
  builder.select = () => builder
  builder.eq = () => builder
  builder.maybeSingle = () => Promise.resolve({ data: row, error })
  return { from: () => builder } as never
}

describe('getProductById', () => {
  it('returns mapped product when found', async () => {
    const client = fakeClient({ id: '1', name: 'Balón', sku: 'B-1', price: '50.00', description: 'x', category: 'balon', created_at: 't' })
    const result = await getProductById(client, '1')
    expect(result).toEqual({ id: '1', name: 'Balón', sku: 'B-1', price: 50, description: 'x', category: 'balon' })
  })

  it('returns null when not found', async () => {
    const client = fakeClient(null)
    expect(await getProductById(client, 'missing')).toBeNull()
  })
})
