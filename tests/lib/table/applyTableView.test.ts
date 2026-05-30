import { describe, it, expect } from 'vitest'
import { applyTableView } from '@/lib/table/applyTableView'

type Row = { name: string; sku: string; price: number }
const rows: Row[] = [
  { name: 'Balón', sku: 'B-1', price: 200 },
  { name: 'Camiseta', sku: 'C-1', price: 350 },
  { name: 'Gorra', sku: 'G-1', price: 80 },
  { name: 'Botines', sku: 'Z-1', price: 900 },
]

describe('applyTableView', () => {
  it('filters by search across given keys (case-insensitive)', () => {
    const r = applyTableView(rows, { search: 'bal', searchKeys: ['name', 'sku'], page: 1, pageSize: 10 })
    expect(r.rows.map((x) => x.name)).toEqual(['Balón'])
    expect(r.total).toBe(1)
  })
  it('sorts ascending and descending by key', () => {
    const asc = applyTableView(rows, { sortKey: 'price', sortDir: 'asc', page: 1, pageSize: 10 })
    expect(asc.rows.map((x) => x.price)).toEqual([80, 200, 350, 900])
    const desc = applyTableView(rows, { sortKey: 'price', sortDir: 'desc', page: 1, pageSize: 10 })
    expect(desc.rows.map((x) => x.price)).toEqual([900, 350, 200, 80])
  })
  it('paginates and reports totalPages', () => {
    const r = applyTableView(rows, { page: 2, pageSize: 2, sortKey: 'price', sortDir: 'asc' })
    expect(r.rows.map((x) => x.price)).toEqual([350, 900])
    expect(r.total).toBe(4)
    expect(r.totalPages).toBe(2)
  })
  it('returns all when no options', () => {
    expect(applyTableView(rows, { page: 1, pageSize: 10 }).rows).toHaveLength(4)
  })
})
