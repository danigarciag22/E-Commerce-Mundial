'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { OrderRow } from '@/lib/orders/types'
import { ORDER_STATUSES } from '@/lib/orders/types'
import { statusLabel, statusColor } from '@/lib/orders/orderStatus'
import { applyTableView, type SortDir } from '@/lib/table/applyTableView'
import { cn } from '@/lib/utils'

const cop = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })
const PAGE_SIZE = 12

export function OrdersTable({ orders }: { orders: OrderRow[] }) {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<string>('all')
  const [sortKey, setSortKey] = useState<keyof OrderRow>('created_at')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [page, setPage] = useState(1)

  const filtered = status === 'all' ? orders : orders.filter((o) => o.status === status)
  const view = applyTableView(filtered, {
    search, searchKeys: ['customer_email'], sortKey, sortDir, page, pageSize: PAGE_SIZE,
  })

  function toggleSort(key: keyof OrderRow) {
    if (sortKey === key) setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('desc') }
    setPage(1)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          placeholder="Buscar por correo…"
          className="w-full max-w-xs rounded-lg border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1) }}
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="all">Todos los estados</option>
          {ORDER_STATUSES.map((s) => <option key={s} value={s}>{statusLabel(s)}</option>)}
        </select>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/40">
            <tr>
              <th className="px-3 py-2 text-left font-medium text-muted-foreground">#</th>
              <th className="px-3 py-2 text-left font-medium text-muted-foreground">Cliente</th>
              <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                <button type="button" onClick={() => toggleSort('total')} className="inline-flex items-center gap-1 hover:text-foreground">Total {sortKey === 'total' && (sortDir === 'asc' ? '▲' : '▼')}</button>
              </th>
              <th className="px-3 py-2 text-left font-medium text-muted-foreground">Estado</th>
              <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                <button type="button" onClick={() => toggleSort('created_at')} className="inline-flex items-center gap-1 hover:text-foreground">Fecha {sortKey === 'created_at' && (sortDir === 'asc' ? '▲' : '▼')}</button>
              </th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {view.rows.map((o) => (
              <tr key={o.id} className="border-b border-border last:border-0">
                <td className="px-3 py-2.5 font-mono text-xs text-muted-foreground">{o.id.slice(0, 8)}</td>
                <td className="px-3 py-2.5">{o.customer_email ?? '—'}</td>
                <td className="px-3 py-2.5 tabular-nums">{cop.format(o.total)}</td>
                <td className="px-3 py-2.5"><span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', statusColor[o.status as keyof typeof statusColor] ?? 'bg-muted')}>{statusLabel(o.status)}</span></td>
                <td className="px-3 py-2.5 text-muted-foreground">{new Date(o.created_at).toLocaleDateString('es-CO')}</td>
                <td className="px-3 py-2.5"><Link href={`/admin/ordenes/${o.id}`} className="text-sm font-medium hover:underline">Ver</Link></td>
              </tr>
            ))}
            {view.rows.length === 0 && <tr><td colSpan={6} className="px-3 py-8 text-center text-muted-foreground">Sin órdenes.</td></tr>}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{view.total} órdenes</span>
        <div className="flex items-center gap-2">
          <button type="button" disabled={page <= 1} onClick={() => setPage(page - 1)} className="rounded-md border border-border px-2 py-1 disabled:opacity-40">Anterior</button>
          <span>{page} / {view.totalPages}</span>
          <button type="button" disabled={page >= view.totalPages} onClick={() => setPage(page + 1)} className="rounded-md border border-border px-2 py-1 disabled:opacity-40">Siguiente</button>
        </div>
      </div>
    </div>
  )
}
