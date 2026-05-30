import { describe, it, expect } from 'vitest'
import { validateProductInput } from '@/lib/products/validateProductInput'

const valid = { name: 'Balón', sku: 'B-1', price: '50000', category: 'balon', description: 'x', stock: '10', active: 'on' }

describe('validateProductInput', () => {
  it('accepts valid input and coerces price to number', () => {
    const r = validateProductInput(valid)
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.data).toEqual({ name: 'Balón', sku: 'B-1', price: 50000, category: 'balon', description: 'x', stock: 10, active: true })
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
  it('coerces stock to a non-negative integer', () => {
    const r = validateProductInput({ ...valid, stock: '25' })
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.data.stock).toBe(25)
  })
  it('defaults stock to 0 when empty', () => {
    const r = validateProductInput({ ...valid, stock: '' })
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.data.stock).toBe(0)
  })
  it('rejects negative stock', () => {
    expect(validateProductInput({ ...valid, stock: '-3' }).ok).toBe(false)
  })
  it('parses active from "on"/"true"', () => {
    const r = validateProductInput({ ...valid, active: 'on' })
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.data.active).toBe(true)
  })
  it('active defaults false when absent', () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { active: _a, ...withoutActive } = valid
    const r = validateProductInput(withoutActive)
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.data.active).toBe(false)
  })
})
