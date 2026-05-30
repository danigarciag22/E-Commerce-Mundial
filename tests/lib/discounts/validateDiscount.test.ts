import { describe, it, expect } from 'vitest'
import { validateDiscount } from '@/lib/discounts/validateDiscount'

describe('validateDiscount', () => {
  it('accepts valid input and uppercases the code', () => {
    const r = validateDiscount({ code: 'mundial10', percent: '10', expires_at: '2030-01-01' })
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.data.code).toBe('MUNDIAL10')
      expect(r.data.percent).toBe(10)
      expect(r.data.expires_at).toBe('2030-01-01')
    }
  })
  it('allows empty expiry as null', () => {
    const r = validateDiscount({ code: 'X', percent: '5', expires_at: '' })
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.data.expires_at).toBeNull()
  })
  it('rejects empty code', () => {
    expect(validateDiscount({ code: '', percent: '5' }).ok).toBe(false)
  })
  it('rejects percent out of 1..100', () => {
    expect(validateDiscount({ code: 'A', percent: '0' }).ok).toBe(false)
    expect(validateDiscount({ code: 'A', percent: '101' }).ok).toBe(false)
    expect(validateDiscount({ code: 'A', percent: 'x' }).ok).toBe(false)
  })
})
