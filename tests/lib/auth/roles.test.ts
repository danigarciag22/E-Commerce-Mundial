import { describe, it, expect } from 'vitest'
import { isAdmin } from '@/lib/auth/roles'

describe('isAdmin', () => {
  it('true for admin profile', () => { expect(isAdmin({ role: 'admin' })).toBe(true) })
  it('false for customer profile', () => { expect(isAdmin({ role: 'customer' })).toBe(false) })
  it('false for null profile', () => { expect(isAdmin(null)).toBe(false) })
  it('false for unknown role', () => { expect(isAdmin({ role: 'whatever' })).toBe(false) })
})
