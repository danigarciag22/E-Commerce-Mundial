# CRM Customers Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax.

**Goal:** A customers module: a table of customers (email, registered/role, # orders, total spent, last order) with search + sort, and a customer detail page showing their order history. Customers are derived from order `customer_email` (guest reality) merged with registered `app_users`.

**Architecture:** A pure `aggregateCustomers(orders, profiles)` builds the customer list from order rows (group by email → counts, spend, last date) merged with `app_users` profiles (registered flag + role). `getCustomers(client)` fetches both and aggregates. The list renders through a client `CustomersTable` using `applyTableView`. Detail keys on the URL-encoded email and lists that email's orders. All via admin RLS session.

**Tech Stack:** Next.js 16, TypeScript, Tailwind/shadcn, Vitest, Playwright.

> **Existing (use, do NOT recreate):**
> - `src/lib/table/applyTableView.ts`, `src/lib/supabase/server.ts` (`createClient`), `src/lib/orders/getOrders.ts` (`getOrders` → OrderRow[]), `src/lib/orders/orderStatus.ts` (`statusLabel`,`statusColor`).
> - `app_users` has admin SELECT policy ("admins read all profiles" via is_admin); orders readable by admin.
> - `cn` at `src/lib/utils.ts`. COP formatter pattern.

---

## File Structure

| File | Responsibility |
|------|----------------|
| `src/lib/customers/aggregate.ts` | pure `aggregateCustomers(orders, profiles)` + `Customer` type |
| `tests/lib/customers/aggregate.test.ts` | aggregation tests |
| `src/lib/customers/getCustomers.ts` | fetch orders + profiles, aggregate |
| `src/components/admin/CustomersTable.tsx` | interactive client table |
| `src/app/admin/clientes/page.tsx` | customers list |
| `src/app/admin/clientes/[email]/page.tsx` | customer detail + order history |
| `tests/e2e/admin-customers.spec.ts` | E2E (skips without creds) |

---

## Task 1: aggregateCustomers (TDD, pure)

**Files:**
- Create: `tests/lib/customers/aggregate.test.ts`
- Create: `src/lib/customers/aggregate.ts`

- [ ] **Step 1: Failing test**

```typescript
// tests/lib/customers/aggregate.test.ts
import { describe, it, expect } from 'vitest'
import { aggregateCustomers, type CustomerOrder, type CustomerProfile } from '@/lib/customers/aggregate'

const orders: CustomerOrder[] = [
  { customer_email: 'a@x.com', total: 100, status: 'paid', created_at: '2026-01-03T00:00:00Z' },
  { customer_email: 'a@x.com', total: 50, status: 'pending', created_at: '2026-01-05T00:00:00Z' },
  { customer_email: 'b@x.com', total: 200, status: 'paid', created_at: '2026-01-01T00:00:00Z' },
  { customer_email: null, total: 999, status: 'paid', created_at: '2026-01-02T00:00:00Z' },
]
const profiles: CustomerProfile[] = [
  { email: 'a@x.com', role: 'customer' },
  { email: 'admin@x.com', role: 'admin' },
]

describe('aggregateCustomers', () => {
  it('groups orders by email, counts, sums paid spend, tracks last order', () => {
    const list = aggregateCustomers(orders, profiles)
    const a = list.find((c) => c.email === 'a@x.com')!
    expect(a.orders).toBe(2)
    expect(a.totalSpent).toBe(100)        // only paid counts toward spend
    expect(a.lastOrder).toBe('2026-01-05T00:00:00Z')
    expect(a.registered).toBe(true)
    expect(a.role).toBe('customer')
  })
  it('ignores orders with null email', () => {
    const list = aggregateCustomers(orders, profiles)
    expect(list.some((c) => c.email === null)).toBe(false)
  })
  it('includes registered profiles with zero orders', () => {
    const list = aggregateCustomers(orders, profiles)
    const admin = list.find((c) => c.email === 'admin@x.com')!
    expect(admin.orders).toBe(0)
    expect(admin.totalSpent).toBe(0)
    expect(admin.registered).toBe(true)
  })
  it('marks guest customers (orders but no profile) as not registered', () => {
    const list = aggregateCustomers(orders, profiles)
    const b = list.find((c) => c.email === 'b@x.com')!
    expect(b.registered).toBe(false)
    expect(b.role).toBeNull()
  })
})
```

- [ ] **Step 2: Run — FAIL** (`npm test -- aggregate`).

- [ ] **Step 3: Implement**

```typescript
// src/lib/customers/aggregate.ts
export type CustomerOrder = {
  customer_email: string | null
  total: number
  status: string
  created_at: string
}

export type CustomerProfile = { email: string; role: string }

export type Customer = {
  email: string
  registered: boolean
  role: string | null
  orders: number
  totalSpent: number
  lastOrder: string | null
}

export function aggregateCustomers(orders: CustomerOrder[], profiles: CustomerProfile[]): Customer[] {
  const map = new Map<string, Customer>()

  const ensure = (email: string): Customer => {
    let c = map.get(email)
    if (!c) {
      c = { email, registered: false, role: null, orders: 0, totalSpent: 0, lastOrder: null }
      map.set(email, c)
    }
    return c
  }

  for (const o of orders) {
    if (!o.customer_email) continue
    const c = ensure(o.customer_email)
    c.orders += 1
    if (o.status === 'paid') c.totalSpent += Number(o.total)
    if (!c.lastOrder || o.created_at > c.lastOrder) c.lastOrder = o.created_at
  }

  for (const p of profiles) {
    const c = ensure(p.email)
    c.registered = true
    c.role = p.role
  }

  return [...map.values()]
}
```

- [ ] **Step 4: Run — PASS** (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/customers/aggregate.ts tests/lib/customers/aggregate.test.ts
git commit -m "feat: add customer aggregation"
```

---

## Task 2: getCustomers + getCustomerOrders

**Files:**
- Create: `src/lib/customers/getCustomers.ts`

- [ ] **Step 1: Implement**

```typescript
// src/lib/customers/getCustomers.ts
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/types/database'
import { aggregateCustomers, type Customer, type CustomerOrder, type CustomerProfile } from './aggregate'

export async function getCustomers(client: SupabaseClient<Database>): Promise<Customer[]> {
  const [ordersRes, profilesRes] = await Promise.all([
    client.from('orders').select('customer_email, total, status, created_at'),
    client.from('app_users').select('email, role'),
  ])
  if (ordersRes.error) throw new Error(ordersRes.error.message)
  if (profilesRes.error) throw new Error(profilesRes.error.message)

  const orders: CustomerOrder[] = (ordersRes.data ?? []).map((o) => ({
    customer_email: o.customer_email,
    total: Number(o.total),
    status: o.status,
    created_at: o.created_at,
  }))
  const profiles: CustomerProfile[] = (profilesRes.data ?? []).map((p) => ({ email: p.email, role: p.role }))

  return aggregateCustomers(orders, profiles)
    .sort((a, b) => b.totalSpent - a.totalSpent)
}

export async function getCustomerOrders(client: SupabaseClient<Database>, email: string) {
  const { data, error } = await client
    .from('orders')
    .select('id, total, status, created_at')
    .eq('customer_email', email)
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []).map((o) => ({ id: o.id, total: Number(o.total), status: o.status, created_at: o.created_at }))
}
```

- [ ] **Step 2: Verify** — `npx tsc --noEmit` clean.

- [ ] **Step 3: Commit**

```bash
git add src/lib/customers/getCustomers.ts
git commit -m "feat: add getCustomers helpers"
```

---

## Task 3: CustomersTable + page

**Files:**
- Create: `src/components/admin/CustomersTable.tsx`
- Create: `src/app/admin/clientes/page.tsx`

- [ ] **Step 1: CustomersTable (client, interactive)**

Takes `customers: Customer[]`. Search by email, sortable headers (Órdenes, Gasto), pagination (pageSize 15). Columns: Email, Tipo (Registrado/Invitado + admin badge), Órdenes, Gasto (COP), Última orden (date or —), link to detail (`/admin/clientes/${encodeURIComponent(email)}`).

```tsx
// src/components/admin/CustomersTable.tsx
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
```

- [ ] **Step 2: Page**

```tsx
// src/app/admin/clientes/page.tsx
import { createClient } from '@/lib/supabase/server'
import { getCustomers } from '@/lib/customers/getCustomers'
import { CustomersTable } from '@/components/admin/CustomersTable'

export default async function AdminCustomersPage() {
  const supabase = await createClient()
  const customers = await getCustomers(supabase)
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold tracking-tight">Clientes</h1>
      <CustomersTable customers={customers} />
    </div>
  )
}
```

- [ ] **Step 3: Verify** — `npx tsc --noEmit`, `npm run build` clean. Smoke: `/admin/clientes` lists ~15 demo emails + registered admin, search/sort/paginate work. Stop server, free port.

- [ ] **Step 4: Commit**

```bash
git add src/components/admin/CustomersTable.tsx src/app/admin/clientes/page.tsx
git commit -m "feat: add customers table"
```

---

## Task 4: Customer detail page

**Files:**
- Create: `src/app/admin/clientes/[email]/page.tsx`

- [ ] **Step 1: Implement**

```tsx
// src/app/admin/clientes/[email]/page.tsx
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getCustomerOrders } from '@/lib/customers/getCustomers'
import { statusLabel, statusColor } from '@/lib/orders/orderStatus'
import { cn } from '@/lib/utils'

const cop = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })

export default async function CustomerDetailPage({ params }: { params: Promise<{ email: string }> }) {
  const { email: raw } = await params
  const email = decodeURIComponent(raw)
  const supabase = await createClient()
  const orders = await getCustomerOrders(supabase, email)

  const paid = orders.filter((o) => o.status === 'paid')
  const spent = paid.reduce((n, o) => n + o.total, 0)

  return (
    <div className="flex flex-col gap-6">
      <Link href="/admin/clientes" className="text-sm text-muted-foreground hover:underline">← Clientes</Link>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{email}</h1>
        <p className="text-sm text-muted-foreground">{orders.length} órdenes · {cop.format(spent)} gastado (pagado)</p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/40">
            <tr>
              <th className="px-3 py-2 text-left font-medium text-muted-foreground">Orden</th>
              <th className="px-3 py-2 text-left font-medium text-muted-foreground">Estado</th>
              <th className="px-3 py-2 text-left font-medium text-muted-foreground">Total</th>
              <th className="px-3 py-2 text-left font-medium text-muted-foreground">Fecha</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="border-b border-border last:border-0">
                <td className="px-3 py-2.5 font-mono text-xs text-muted-foreground">{o.id.slice(0, 8)}</td>
                <td className="px-3 py-2.5"><span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', statusColor[o.status as keyof typeof statusColor] ?? 'bg-muted')}>{statusLabel(o.status)}</span></td>
                <td className="px-3 py-2.5 tabular-nums">{cop.format(o.total)}</td>
                <td className="px-3 py-2.5 text-muted-foreground">{new Date(o.created_at).toLocaleDateString('es-CO')}</td>
                <td className="px-3 py-2.5"><Link href={`/admin/ordenes/${o.id}`} className="text-sm font-medium hover:underline">Ver orden</Link></td>
              </tr>
            ))}
            {orders.length === 0 && <tr><td colSpan={5} className="px-3 py-8 text-center text-muted-foreground">Sin órdenes.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify** — `npx tsc --noEmit`, `npm run build` clean. Smoke: click a customer → their orders list; each links to the order detail.

- [ ] **Step 3: Commit**

```bash
git add src/app/admin/clientes/
git commit -m "feat: add customer detail with order history"
```

---

## Task 5: E2E (skips without creds)

**Files:**
- Create: `tests/e2e/admin-customers.spec.ts`

- [ ] **Step 1: Write**

```typescript
// tests/e2e/admin-customers.spec.ts
import { test, expect } from '@playwright/test'

const email = process.env.E2E_ADMIN_EMAIL
const password = process.env.E2E_ADMIN_PASSWORD

test.skip(!email || !password, 'needs E2E_ADMIN_EMAIL/PASSWORD')

test('customers list loads and a detail opens', async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel('Correo').fill(email!)
  await page.getByLabel('Contraseña').fill(password!)
  await page.getByRole('button', { name: /Entrar/i }).click()
  await expect(page.getByRole('button', { name: /Salir/i })).toBeVisible()

  await page.goto('/admin/clientes')
  await expect(page.getByRole('heading', { name: 'Clientes' })).toBeVisible()
  await expect(page.locator('table')).toBeVisible()
  await page.getByRole('link', { name: 'Ver' }).first().click()
  await expect(page).toHaveURL(/\/admin\/clientes\//)
})
```

- [ ] **Step 2: Run** — skips without creds; full suite pass/skip; port free.

- [ ] **Step 3: Commit**

```bash
git add tests/e2e/admin-customers.spec.ts
git commit -m "test: add admin customers e2e (skips without creds)"
```

---

## Self-Review

- **Spec coverage:** Clientes module — table (email, registered/role, orders, spend, last order; search+sort) Tasks 1-3; detail with order history Task 4; E2E Task 5.
- **Placeholder scan:** No TBD. Customers derived from order emails + profiles, matching the guest-checkout reality established in the foundation seed.
- **Type consistency:** `Customer`/`CustomerOrder`/`CustomerProfile` (Task 1) used by getCustomers (Task 2) + CustomersTable (Task 3). `applyTableView` generic over `Customer`. Detail reuses `statusLabel`/`statusColor` from orders.
- **Security:** Reads via admin session + RLS (`is_admin` policies on orders + app_users). No writes here. No service-role.
