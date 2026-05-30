import { describe, it, expect } from 'vitest'
import { validateProductInput } from '@/lib/products/validateProductInput'

const valid = { name: 'Balón', sku: 'B-1', price: '50000', category: 'balon', description: 'x' }

describe('validateProductInput', () => {
  it('accepts valid input and coerces price to number', () => {
    const r = validateProductInput(valid)
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.data).toEqual({ name: 'Balón', sku: 'B-1', price: 50000, category: 'balon', description: 'x' })
  })
  it('treats empty description as null', () => {
    const r = validateProductInput({ ...valid, description: '' })
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.data.description).toBeNull()
  })
  it('rejects missing name', () => {
    const r = validateProductInput({ ...valid, name: '' })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.errors.name).toBeTruthy()
  })
  it('rejects missing sku', () => {
    const r = validateProductInput({ ...valid, sku: '' })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.errors.sku).toBeTruthy()
  })
  it('rejects non-numeric or negative price', () => {
    expect(validateProductInput({ ...valid, price: 'abc' }).ok).toBe(false)
    expect(validateProductInput({ ...valid, price: '-5' }).ok).toBe(false)
  })
  it('rejects invalid category', () => {
    const r = validateProductInput({ ...valid, category: 'hacking' })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.errors.category).toBeTruthy()
  })
})
