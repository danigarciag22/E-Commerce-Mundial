import { describe, it, expect } from 'vitest'
import { buildSearchOr } from '@/lib/products/buildSearchOr'

describe('buildSearchOr', () => {
  it('builds an ilike OR across name, sku, description', () => {
    expect(buildSearchOr('balon')).toBe('name.ilike.%balon%,sku.ilike.%balon%,description.ilike.%balon%')
  })
  it('trims and lowercases the term', () => {
    expect(buildSearchOr('  Balón  ')).toBe('name.ilike.%balón%,sku.ilike.%balón%,description.ilike.%balón%')
  })
  it('strips characters that break .or syntax (commas, parens)', () => {
    expect(buildSearchOr('a,b(c)')).toBe('name.ilike.%abc%,sku.ilike.%abc%,description.ilike.%abc%')
  })
  it('returns empty string for blank query', () => {
    expect(buildSearchOr('   ')).toBe('')
    expect(buildSearchOr('')).toBe('')
  })
})
