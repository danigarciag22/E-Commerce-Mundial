import { describe, it, expect } from 'vitest'
import { initials } from '@/lib/profile/initials'

describe('initials', () => {
  it('uses two initials from a full name', () => {
    expect(initials('Daniel García', 'x@y.com')).toBe('DG')
  })
  it('uses one initial for a single name', () => {
    expect(initials('Messi', 'x@y.com')).toBe('M')
  })
  it('falls back to the email when name is empty', () => {
    expect(initials(null, 'pedro@y.com')).toBe('P')
    expect(initials('', 'pedro@y.com')).toBe('P')
  })
  it('uppercases', () => {
    expect(initials('ana lopez', 'x@y.com')).toBe('AL')
  })
})
