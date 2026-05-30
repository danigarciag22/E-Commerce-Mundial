# CRM Orders Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax.

**Goal:** An orders module: an interactive orders table (search by email, filter by status, sort by date/total, paginate) and an order detail page showing items + totals + customer with the ability to change the order status.

**Architecture:** Orders fetched server-side (admin RLS session), rendered through a client `OrdersTable` using the existing `applyTableView` helper. Status change is a Server Action gated by `requireAdmin`; it requires a new admin UPDATE RLS policy on `orders`. Status values validated by a pure tested function.

**Tech Stack:** Next.js 16, TypeScript, Tailwind/shadcn, Vitest, Playwright.

> **Existing (use, do NOT recreate):**
> - `src/lib/table/applyTableView.ts` — `applyTableView`.
> - `src/lib/supabase/server.ts` — `createClient()`.
> - `src/lib/auth/guards.ts` — `requireAdmin()`.
> - `orders`: id, user_id, customer_email, items (jsonb `[{id,name,price,category,quantity}]`), total, status, payment_intent_id, created_at. Statuses: pending|paid|shipped|cancelled.
> - `is_admin()` RLS function exists; orders has "admins read all orders" SELECT but NO admin UPDATE policy yet.
> - `cn` at `src/lib/utils.ts`. COP formatter pattern as elsewhere.

---

## File Structure

| File | Responsibility |
|------|----------------|
| `supabase/migrations/0011_admin_update_orders.sql` | admin UPDATE policy on orders |
| `src/lib/orders/types.ts` | `OrderRow`, `OrderItem`, `ORDER_STATUSES`, `OrderStatus` |
| `src/lib/orders/getOrders.ts` | fetch all orders (table) |
| `src/lib/orders/getOrderById.ts` | fetch one order |
| `src/lib/orders/orderStatus.ts` | pure `isValidStatus` + label/color maps |
| `tests/lib/orders/orderStatus.test.ts` | status validation tests |
| `src/lib/orders/orderActions.ts` | `updateOrderStatusAction` (requireAdmin) |
| `src/components/admin/OrdersTable.tsx` | interactive client table |
| `src/components/admin/OrderStatusForm.tsx` | status select + save (client) |
| `src/app/admin/ordenes/page.tsx` | orders list |
| `src/app/admin/ordenes/[id]/page.tsx` | order detail + status change |
| `tests/e2e/admin-orders.spec.ts` | E2E (skips without creds) |

---

## Task 1: Admin UPDATE policy on orders

**Files:**
- Create: `supabase/migrations/0011_admin_update_orders.sql`

- [ ] **Step 1: Write** (controller applies via MCP)

```sql
create policy "admins update orders" on orders for update
  using (public.is_admin()) with check (public.is_admin());
```

- [ ] **Step 2: Apply via MCP** (`apply_migration` name `0011_admin_update_orders`).

- [ ] **Step 3: Verify** — `get_advisors` (security): no new criticals.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/0011_admin_update_orders.sql
git commit -m "feat: allow admins to update order status (RLS)"
```

---

## Task 2: Order status logic (TDD, pure)

**Files:**
- Create: `src/lib/orders/types.ts`
- Create: `tests/lib/orders/orderStatus.test.ts`
- Create: `src/lib/orders/orderStatus.ts`

- [ ] **Step 1: Types**

```typescript
// src/lib/orders/types.ts
export const ORDER_STATUSES = ['pending', 'paid', 'shipped', 'cancelled'] as const
export type OrderStatus = (typeof ORDER_STATUSES)[number]

export type OrderItem = { id: string; name: string; price: number; category: string; quantity: number }

export type OrderRow = {
  id: string
  customer_email: string | null
  total: number
  status: string
  created_at: string
  items: OrderItem[]
}
```

- [ ] **Step 2: Failing test**

```typescript
// tests/lib/orders/orderStatus.test.ts
import { describe, it, expect } from 'vitest'
import { isValidStatus, statusLabel } from '@/lib/orders/orderStatus'

describe('orderStatus', () => {
  it('accepts the four valid statuses', () => {
    for (const s of ['pending', 'paid', 'shipped', 'cancelled']) {
      expect(isValidStatus(s)).toBe(true)
    }
  })
  it('rejects anything else', () => {
    expect(isValidStatus('hacked')).toBe(false)
    expect(isValidStatus('')).toBe(false)
  })
  it('maps a Spanish label', () => {
    expect(statusLabel('paid')).toBe('Pagado')
    expect(statusLabel('weird')).toBe('weird')
  })
})
```

- [ ] **Step 3: Run — FAIL** (`npm test -- orderStatus`).

- [ ] **Step 4: Implement**

```typescript
// src/lib/orders/orderStatus.ts
import { ORDER_STATUSES, type OrderStatus } from './types'

export function isValidStatus(s: string): s is OrderStatus {
  return (ORDER_STATUSES as readonly string[]).includes(s)
}

const labels: Record<OrderStatus, string> = {
  pending: 'Pendiente', paid: 'Pagado', shipped: 'Enviado', cancelled: 'Cancelado',
}
export function statusLabel(s: string): string {
  return isValidStatus(s) ? labels[s] : s
}

export const statusColor: Record<OrderStatus, string> = {
  pending: 'bg-amber-100 text-amber-800',
  paid: 'bg-green-100 text-green-800',
  shipped: 'bg-blue-100 text-blue-800',
  cancelled: 'bg-destructive/10 text-destructive',
}
```

- [ ] **Step 5: Run — PASS** (3 tests).

- [ ] **Step 6: Commit**

```bash
git add src/lib/orders/types.ts src/lib/orders/orderStatus.ts tests/lib/orders/orderStatus.test.ts
git commit -m "feat: add order status helpers"
```

---

## Task 3: getOrders + getOrderById

**Files:**
- Create: `src/lib/orders/getOrders.ts`
- Create: `src/lib/orders/getOrderById.ts`

- [ ] **Step 1: getOrders**

```typescript
// src/lib/orders/getOrders.ts
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/types/database'
import type { OrderRow, OrderItem } from './types'

export async function getOrders(client: SupabaseClient<Database>): Promise<OrderRow[]> {
  const { data, error } = await client
    .from('orders')
    .select('id, customer_email, total, status, created_at, items')
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []).map((o) => ({
    id: o.id,
    customer_email: o.customer_email,
    total: Number(o.total),
    status: o.status,
    created_at: o.created_at,
    items: Array.isArray(o.items) ? (o.items as unknown as OrderItem[]) : [],
  }))
}
```

- [ ] **Step 2: getOrderById**

```typescript
// src/lib/orders/getOrderById.ts
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/types/database'
import type { OrderRow, OrderItem } from './types'

export async function getOrderById(client: SupabaseClient<Database>, id: string): Promise<OrderRow | null> {
  const { data, error } = await client
    .from('orders')
    .select('id, customer_email, total, status, created_at, items')
    .eq('id', id)
    .maybeSingle()
  if (error) throw new Error(error.message)
  if (!data) return null
  return {
    id: data.id,
    customer_email: data.customer_email,
    total: Number(data.total),
    status: data.status,
    created_at: data.created_at,
    items: Array.isArray(data.items) ? (data.items as unknown as OrderItem[]) : [],
  }
}
```

- [ ] **Step 3: Verify** — `npx tsc --noEmit` clean.

- [ ] **Step 4: Commit**

```bash
git add src/lib/orders/getOrders.ts src/lib/orders/getOrderById.ts
git commit -m "feat: add order fetch helpers"
```

---

## Task 4: updateOrderStatusAction

**Files:**
- Create: `src/lib/orders/orderActions.ts`

- [ ] **Step 1: Implement**

```typescript
// src/lib/orders/orderActions.ts
'use server'

import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/auth/guards'
import { createClient } from '@/lib/supabase/server'
import { isValidStatus } from './orderStatus'

export async function updateOrderStatusAction(formData: FormData): Promise<void> {
  await requireAdmin()
  const id = String(formData.get('id') ?? '')
  const status = String(formData.get('status') ?? '')
  if (!id || !isValidStatus(status)) return
  const supabase = await createClient()
  const { error } = await supabase.from('orders').update({ status }).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/ordenes')
  revalidatePath(`/admin/ordenes/${id}`)
  revalidatePath('/admin')
}
```

- [ ] **Step 2: Verify** — `npx tsc --noEmit` clean.

- [ ] **Step 3: Commit**

```bash
git add src/lib/orders/orderActions.ts
git commit -m "feat: add update order status action"
```

---

## Task 5: OrdersTable + orders page

**Files:**
- Create: `src/components/admin/OrdersTable.tsx`
- Create: `src/app/admin/ordenes/page.tsx`

- [ ] **Step 1: OrdersTable (client, interactive)**

Takes `orders: OrderRow[]`. Local state: search (customer_email), statusFilter (all|pending|paid|shipped|cancelled), sortKey ('created_at'|'total'), sortDir, page. Filter by status first, then `applyTableView` for search/sort/paginate. Columns: # (id slice 0-8), Cliente (email), Total (COP), Estado (badge via statusColor/statusLabel), Fecha (created_at locale), → link to detail. pageSize 12.

```tsx
// src/components/admin/OrdersTable.tsx
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
```

- [ ] **Step 2: Orders page**

```tsx
// src/app/admin/ordenes/page.tsx
import { createClient } from '@/lib/supabase/server'
import { getOrders } from '@/lib/orders/getOrders'
import { OrdersTable } from '@/components/admin/OrdersTable'

export default async function AdminOrdersPage() {
  const supabase = await createClient()
  const orders = await getOrders(supabase)
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold tracking-tight">Órdenes</h1>
      <OrdersTable orders={orders} />
    </div>
  )
}
```

- [ ] **Step 3: Verify** — `npx tsc --noEmit`, `npm run build` clean. Smoke as admin: `/admin/ordenes` lists demo orders, search/status filter/sort/paginate work. Stop server, free port.

- [ ] **Step 4: Commit**

```bash
git add src/components/admin/OrdersTable.tsx src/app/admin/ordenes/page.tsx
git commit -m "feat: add interactive orders table"
```

---

## Task 6: Order detail + status change

**Files:**
- Create: `src/components/admin/OrderStatusForm.tsx`
- Create: `src/app/admin/ordenes/[id]/page.tsx`

- [ ] **Step 1: OrderStatusForm (client)**

```tsx
// src/components/admin/OrderStatusForm.tsx
'use client'

import { updateOrderStatusAction } from '@/lib/orders/orderActions'
import { ORDER_STATUSES } from '@/lib/orders/types'
import { statusLabel } from '@/lib/orders/orderStatus'

export function OrderStatusForm({ id, status }: { id: string; status: string }) {
  return (
    <form action={updateOrderStatusAction} className="flex items-center gap-2">
      <input type="hidden" name="id" value={id} />
      <select name="status" defaultValue={status} className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        {ORDER_STATUSES.map((s) => <option key={s} value={s}>{statusLabel(s)}</option>)}
      </select>
      <button type="submit" className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90">Actualizar</button>
    </form>
  )
}
```

- [ ] **Step 2: Order detail page**

```tsx
// src/app/admin/ordenes/[id]/page.tsx
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getOrderById } from '@/lib/orders/getOrderById'
import { OrderStatusForm } from '@/components/admin/OrderStatusForm'
import { statusLabel, statusColor } from '@/lib/orders/orderStatus'
import { cn } from '@/lib/utils'

const cop = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const order = await getOrderById(supabase, id)
  if (!order) notFound()

  return (
    <div className="flex flex-col gap-6">
      <Link href="/admin/ordenes" className="text-sm text-muted-foreground hover:underline">← Órdenes</Link>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Orden {order.id.slice(0, 8)}</h1>
          <p className="text-sm text-muted-foreground">{new Date(order.created_at).toLocaleString('es-CO')} · {order.customer_email ?? 'sin correo'}</p>
        </div>
        <span className={cn('rounded-full px-3 py-1 text-sm font-medium', statusColor[order.status as keyof typeof statusColor] ?? 'bg-muted')}>{statusLabel(order.status)}</span>
      </div>

      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-muted-foreground">Cambiar estado</h2>
        <OrderStatusForm id={order.id} status={order.status} />
      </div>

      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-muted-foreground">Artículos</h2>
        <ul className="divide-y divide-border text-sm">
          {order.items.map((it, i) => (
            <li key={i} className="flex items-center justify-between py-2.5">
              <span>{it.name} <span className="text-muted-foreground">× {it.quantity}</span></span>
              <span className="tabular-nums">{cop.format(it.price * it.quantity)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex items-center justify-between border-t border-border pt-4 font-semibold">
          <span>Total</span>
          <span className="tabular-nums">{cop.format(order.total)}</span>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Verify** — `npx tsc --noEmit`, `npm run build` clean. Smoke: open an order, change status, see it persist + dashboard/table reflect it. Bad id → 404. Stop server, free port.

- [ ] **Step 4: Commit**

```bash
git add src/components/admin/OrderStatusForm.tsx src/app/admin/ordenes/
git commit -m "feat: add order detail page with status change"
```

---

## Task 7: E2E (skips without creds)

**Files:**
- Create: `tests/e2e/admin-orders.spec.ts`

- [ ] **Step 1: Write**

```typescript
// tests/e2e/admin-orders.spec.ts
import { test, expect } from '@playwright/test'

const email = process.env.E2E_ADMIN_EMAIL
const password = process.env.E2E_ADMIN_PASSWORD

test.skip(!email || !password, 'needs E2E_ADMIN_EMAIL/PASSWORD')

test('orders table lists and a detail page opens', async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel('Correo').fill(email!)
  await page.getByLabel('Contraseña').fill(password!)
  await page.getByRole('button', { name: /Entrar/i }).click()
  await expect(page.getByRole('button', { name: /Salir/i })).toBeVisible()

  await page.goto('/admin/ordenes')
  await expect(page.getByRole('heading', { name: 'Órdenes' })).toBeVisible()
  await expect(page.locator('table')).toBeVisible()

  const firstView = page.getByRole('link', { name: 'Ver' }).first()
  await firstView.click()
  await expect(page).toHaveURL(/\/admin\/ordenes\//)
  await expect(page.getByRole('button', { name: /Actualizar/i })).toBeVisible()
})
```

- [ ] **Step 2: Run** — `npx playwright test admin-orders` (skips). Full suite pass/skip. Port free.

- [ ] **Step 3: Commit**

```bash
git add tests/e2e/admin-orders.spec.ts
git commit -m "test: add admin orders e2e (skips without creds)"
```

---

## Self-Review

- **Spec coverage:** Órdenes module — table (search email, filter status, sort date/total, paginate) Task 5; detail + change status Task 6; status RLS Task 1; helpers Tasks 2-4; E2E Task 7.
- **Placeholder scan:** No TBD. Status transitions are unrestricted (any → any of the 4) by design; a transition state-machine is YAGNI for now.
- **Type consistency:** `OrderRow`/`OrderItem`/`OrderStatus`/`ORDER_STATUSES` (Task 2) used by getOrders/getOrderById (Task 3), OrdersTable/OrderStatusForm (Tasks 5-6), action (Task 4). `applyTableView` generic over `OrderRow`.
- **Security:** New admin UPDATE policy on orders (Task 1) lets the admin session change status; action gated by `requireAdmin`. Reads via existing "admins read all orders". No service-role.
