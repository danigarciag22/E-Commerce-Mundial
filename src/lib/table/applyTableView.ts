export type SortDir = 'asc' | 'desc'

export type TableViewOptions<T> = {
  search?: string
  searchKeys?: (keyof T)[]
  sortKey?: keyof T
  sortDir?: SortDir
  page: number
  pageSize: number
}

export type TableViewResult<T> = {
  rows: T[]
  total: number
  totalPages: number
}

export function applyTableView<T>(rows: T[], opts: TableViewOptions<T>): TableViewResult<T> {
  let out = [...rows]

  const search = opts.search?.trim().toLowerCase()
  if (search && opts.searchKeys?.length) {
    out = out.filter((row) =>
      opts.searchKeys!.some((k) => String(row[k] ?? '').toLowerCase().includes(search)),
    )
  }

  if (opts.sortKey) {
    const key = opts.sortKey
    const dir = opts.sortDir === 'desc' ? -1 : 1
    out.sort((a, b) => {
      const av = a[key]
      const bv = b[key]
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir
      return String(av).localeCompare(String(bv)) * dir
    })
  }

  const total = out.length
  const totalPages = Math.max(1, Math.ceil(total / opts.pageSize))
  const start = (opts.page - 1) * opts.pageSize
  const paged = out.slice(start, start + opts.pageSize)

  return { rows: paged, total, totalPages }
}
