'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { Customer } from '@/lib/customers/aggregate'
import { applyTableView, type SortDir } from '@/lib/table/applyTableView'
import { cn } from '@/lib/utils'

const cop = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })
const PAGE_SIZE = 15

export function CustomersTable({ customers }: { customers: Customer[] }) {
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<keyof Customer>('totalSpent')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [page, setPage] = useState(1)

  const view = applyTableView(customers, { search, searchKeys: ['email'], sortKey, sortDir, page, pageSize: PAGE_SIZE })

  function toggleSort(key: keyof Customer) {
    if (sortKey === key) setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('desc') }
    setPage(1)
  }
  const SortBtn = ({ label, k }: { label: string; k: keyof Customer }) => (
    <button type="button" onClick={() => toggleSort(k)} className="inline-flex items-center gap-1 hover:text-foreground">
      {label}{sortKey === k && <span>{sortDir === 'asc' ? '▲' : '▼'}</span>}
    </button>
  )

  return (
    <div className="flex flex-col gap-4">
      <input
        value={search}
        onChange={(e) => { setSearch(e.target.value); setPage(1) }}
        placeholder="Buscar por correo…"
        className="w-full max-w-xs rounded-lg border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/40">
            <tr>
              <th className="px-3 py-2 text-left font-medium text-muted-foreground">Email</th>
              <th className="px-3 py-2 text-left font-medium text-muted-foreground">Tipo</th>
              <th className="px-3 py-2 text-left font-medium text-muted-foreground"><SortBtn label="Órdenes" k="orders" /></th>
              <th className="px-3 py-2 text-left font-medium text-muted-foreground"><SortBtn label="Gasto" k="totalSpent" /></th>
              <th className="px-3 py-2 text-left font-medium text-muted-foreground">Última orden</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {view.rows.map((c) => (
              <tr key={c.email} className="border-b border-border last:border-0">
                <td className="px-3 py-2.5 font-medium">{c.email}</td>
                <td className="px-3 py-2.5">
                  {c.registered
                    ? <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', c.role === 'admin' ? 'bg-primary text-primary-foreground' : 'bg-green-100 text-green-800')}>{c.role === 'admin' ? 'Admin' : 'Registrado'}</span>
                    : <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">Invitado</span>}
                </td>
                <td className="px-3 py-2.5 tabular-nums">{c.orders}</td>
                <td className="px-3 py-2.5 tabular-nums">{cop.format(c.totalSpent)}</td>
                <td className="px-3 py-2.5 text-muted-foreground">{c.lastOrder ? new Date(c.lastOrder).toLocaleDateString('es-CO') : '—'}</td>
                <td className="px-3 py-2.5"><Link href={`/admin/clientes/${encodeURIComponent(c.email)}`} className="text-sm font-medium hover:underline">Ver</Link></td>
              </tr>
            ))}
            {view.rows.length === 0 && <tr><td colSpan={6} className="px-3 py-8 text-center text-muted-foreground">Sin clientes.</td></tr>}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{view.total} clientes</span>
        <div className="flex items-center gap-2">
          <button type="button" disabled={page <= 1} onClick={() => setPage(page - 1)} className="rounded-md border border-border px-2 py-1 disabled:opacity-40">Anterior</button>
          <span>{page} / {view.totalPages}</span>
          <button type="button" disabled={page >= view.totalPages} onClick={() => setPage(page + 1)} className="rounded-md border border-border px-2 py-1 disabled:opacity-40">Siguiente</button>
        </div>
      </div>
    </div>
  )
}
