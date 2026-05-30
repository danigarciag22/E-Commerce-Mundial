import { describe, it, expect } from 'vitest'
import { isValidStatus, statusLabel } from '@/lib/orders/orderStatus'

describe('orderStatus', () => {
  it('accepts the four valid statuses', () => {
    for (const s of ['pending', 'paid', 'shipped', 'cancelled']) {
      expect(isValidStatus(s)).toBe(true)
    }
  })
  it('rejects anything else', () => {
    expect(isValidStatus('hacked')).toBe(false)
    expect(isValidStatus('')).toBe(false)
  })
  it('maps a Spanish label', () => {
    expect(statusLabel('paid')).toBe('Pagado')
    expect(statusLabel('weird')).toBe('weird')
  })
})
