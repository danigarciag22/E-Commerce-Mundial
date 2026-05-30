import { describe, it, expect } from 'vitest'
import { parseFilters } from '@/lib/products/filterParams'

describe('parseFilters', () => {
  it('parses category and prices from search params', () => {
    expect(parseFilters({ category: 'balon', minPrice: '100', maxPrice: '500' }))
      .toEqual({ category: 'balon', minPrice: 100, maxPrice: 500 })
  })
  it('ignores invalid category', () => {
    expect(parseFilters({ category: 'hacking' })).toEqual({})
  })
  it('ignores non-numeric prices', () => {
    expect(parseFilters({ minPrice: 'abc' })).toEqual({})
  })
  it('returns empty object for no params', () => {
    expect(parseFilters({})).toEqual({})
  })
})
