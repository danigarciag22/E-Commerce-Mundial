import { describe, it, expect } from 'vitest'
import { createProduct, updateProduct, deleteProduct } from '@/lib/products/adminProducts'
import type { ProductInput } from '@/lib/products/validateProductInput'

const input: ProductInput = { name: 'Balón', sku: 'B-1', price: 50000, category: 'balon', description: 'x' }

function fakeClient() {
  const calls: { op: string; table: string; arg?: unknown; eq?: unknown[] }[] = []
  function table(name: string) {
    return {
      insert(arg: unknown) { calls.push({ op: 'insert', table: name, arg }); return Promise.resolve({ error: null }) },
      update(arg: unknown) { calls.push({ op: 'update', table: name, arg }); return { eq: (...eq: unknown[]) => { calls[calls.length - 1].eq = eq; return Promise.resolve({ error: null }) } } },
      delete() { calls.push({ op: 'delete', table: name }); return { eq: (...eq: unknown[]) => { calls[calls.length - 1].eq = eq; return Promise.resolve({ error: null }) } } },
    }
  }
  return { client: { from: table } as never, calls }
}

describe('adminProducts', () => {
  it('createProduct inserts the validated fields', async () => {
    const { client, calls } = fakeClient()
    await createProduct(client, input)
    expect(calls[0]).toMatchObject({ op: 'insert', table: 'products', arg: input })
  })
  it('updateProduct updates by id', async () => {
    const { client, calls } = fakeClient()
    await updateProduct(client, 'p1', input)
    expect(calls[0]).toMatchObject({ op: 'update', table: 'products', arg: input, eq: ['id', 'p1'] })
  })
  it('deleteProduct deletes by id', async () => {
    const { client, calls } = fakeClient()
    await deleteProduct(client, 'p1')
    expect(calls[0]).toMatchObject({ op: 'delete', table: 'products', eq: ['id', 'p1'] })
  })
  it('throws on db error', async () => {
    const client = { from: () => ({ insert: () => Promise.resolve({ error: { message: 'boom' } }) }) } as never
    await expect(createProduct(client, input)).rejects.toThrow(/boom/)
  })
})
