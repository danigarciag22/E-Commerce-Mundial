'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { Product } from '@/lib/products/types'
import { applyTableView, type SortDir } from '@/lib/table/applyTableView'
import { toggleProductActiveAction } from '@/lib/products/productActions'
import { DeleteProductButton } from './DeleteProductButton'
import { cn } from '@/lib/utils'

const cop = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
})
const PAGE_SIZE = 10

export function ProductsTable({ products }: { products: Product[] }) {
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<keyof Product>('name')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [page, setPage] = useState(1)

  const view = applyTableView(products, {
    search,
    searchKeys: ['name', 'sku'],
    sortKey,
    sortDir,
    page,
    pageSize: PAGE_SIZE,
  })

  function toggleSort(key: keyof Product) {
    if (sortKey === key) setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    else {
      setSortKey(key)
      setSortDir('asc')
    }
    setPage(1)
  }

  const Th = ({ label, k }: { label: string; k?: keyof Product }) => (
    <th className="px-3 py-2 text-left font-medium text-muted-foreground">
      {k ? (
        <button
          type="button"
          onClick={() => toggleSort(k)}
          className="inline-flex items-center gap-1 rounded hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {label}
          {sortKey === k && <span aria-hidden>{sortDir === 'asc' ? '▲' : '▼'}</span>}
        </button>
      ) : (
        label
      )}
    </th>
  )

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(1)
          }}
          placeholder="Buscar por nombre o SKU…"
          aria-label="Buscar productos"
          className="w-full max-w-xs rounded-lg border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <Link
          href="/admin/productos/nuevo"
          className="shrink-0 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Nuevo producto
        </Link>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/40">
            <tr>
              <Th label="Nombre" k="name" />
              <Th label="SKU" />
              <Th label="Categoría" />
              <Th label="Precio" k="price" />
              <Th label="Stock" k="stock" />
              <Th label="Estado" />
              <Th label="" />
            </tr>
          </thead>
          <tbody>
            {view.rows.map((p) => (
              <tr key={p.id} className="border-b border-border last:border-0">
                <td className="px-3 py-2.5 font-medium">{p.name}</td>
                <td className="px-3 py-2.5 text-muted-foreground">{p.sku}</td>
                <td className="px-3 py-2.5 text-muted-foreground">{p.category}</td>
                <td className="px-3 py-2.5 tabular-nums">{cop.format(p.price)}</td>
                <td className="px-3 py-2.5">
                  <span className={cn('tabular-nums', p.stock <= 5 && 'font-semibold text-destructive')}>
                    {p.stock}
                  </span>
                </td>
                <td className="px-3 py-2.5">
                  <form action={toggleProductActiveAction}>
                    <input type="hidden" name="id" value={p.id} />
                    <input type="hidden" name="active" value={(!p.active).toString()} />
                    <button
                      type="submit"
                      className={cn(
                        'rounded-full px-2 py-0.5 text-xs font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                        p.active ? 'bg-green-100 text-green-800' : 'bg-muted text-muted-foreground',
                      )}
                    >
                      {p.active ? 'Activo' : 'Inactivo'}
                    </button>
                  </form>
                </td>
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-3">
                    <Link
                      href={`/admin/productos/${p.id}`}
                      className="rounded-md text-sm font-medium hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      Editar
                    </Link>
                    <DeleteProductButton id={p.id} name={p.name} />
                  </div>
                </td>
              </tr>
            ))}
            {view.rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center text-muted-foreground">
                  Sin resultados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{view.total} productos</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
            className="rounded-md border border-border px-2 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40"
          >
            Anterior
          </button>
          <span>
            {page} / {view.totalPages}
          </span>
          <button
            type="button"
            disabled={page >= view.totalPages}
            onClick={() => setPage(page + 1)}
            className="rounded-md border border-border px-2 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40"
          >
            Siguiente
          </button>
        </div>
      </div>
    </div>
  )
}
