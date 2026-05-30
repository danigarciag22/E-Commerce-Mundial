import { describe, it, expect } from 'vitest'
import { createOrder } from '@/lib/orders/createOrder'

function fakeClient(captured: { row?: unknown }) {
  return {
    from() {
      return {
        insert(row: unknown) { captured.row = row; return Promise.resolve({ error: null }) },
      }
    },
  } as never
}

describe('createOrder', () => {
  it('inserts an order row with paid status and payment id', async () => {
    const captured: { row?: unknown } = {}
    await createOrder(fakeClient(captured), {
      paymentIntentId: 'pay-1', total: 250,
      items: [{ id: 'p1', name: 'Balón', price: 100, category: 'balon', quantity: 2 }],
      status: 'paid',
    })
    expect(captured.row).toEqual({
      payment_intent_id: 'pay-1', total: 250, status: 'paid', user_id: null,
      items: [{ id: 'p1', name: 'Balón', price: 100, category: 'balon', quantity: 2 }],
    })
  })
  it('throws when the insert errors', async () => {
    const client = { from() { return { insert() { return Promise.resolve({ error: { message: 'boom' } }) } } } } as never
    await expect(createOrder(client, { paymentIntentId: 'x', total: 1, items: [], status: 'paid' })).rejects.toThrow(/boom/)
  })
})
