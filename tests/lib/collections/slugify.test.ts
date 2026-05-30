import { describe, it, expect } from 'vitest'
import { slugify } from '@/lib/collections/slugify'

describe('slugify', () => {
  it('lowercases and hyphenates', () => {
    expect(slugify('Selección Colombia')).toBe('seleccion-colombia')
  })
  it('strips accents and symbols', () => {
    expect(slugify('Mundial 2026 ⚽!')).toBe('mundial-2026')
  })
  it('collapses spaces and trims hyphens', () => {
    expect(slugify('  Ofertas   Especiales  ')).toBe('ofertas-especiales')
  })
  it('returns empty for empty', () => {
    expect(slugify('')).toBe('')
  })
})
