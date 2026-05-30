# CRM Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax.

**Goal:** An interactive dashboard at `/admin`: KPI cards (revenue, orders, avg ticket, customers), a sales-over-time line chart, top-products bar chart, orders-by-status donut, a recent-orders table, and a 7/30/90-day range selector.

**Architecture:** A pure `summarize(orders)` function computes all aggregates (KPIs, by-status, sales-by-day, top-products) from raw order rows — fully unit-tested. `getDashboardData(client, days)` fetches orders within the range (admin session + RLS) and calls `summarize`, plus a distinct-customer count. The page (Server Component) reads `?range=` from searchParams, fetches, and renders KPI cards + Recharts client islands + a recent-orders table. Range selector is link-based (`?range=7|30|90`), keeping the page a Server Component.

**Tech Stack:** Next.js 16, TypeScript, Recharts (client), Supabase (admin session), Vitest.

> **Existing (use, do NOT recreate):**
> - `src/lib/supabase/server.ts` — `createClient()`.
> - `src/lib/metrics/getMetrics.ts` — older simple metrics (leave; this plan adds richer dashboard data).
> - `src/app/admin/page.tsx` — current metrics stub (REPLACE).
> - `src/app/admin/layout.tsx` — CRM shell (already wraps this page).
> - `orders` columns: id, customer_email, items (jsonb `[{id,name,price,category,quantity}]`), total, status, created_at.
> - `cn` at `src/lib/utils.ts`. COP: `Intl.NumberFormat('es-CO',{style:'currency',currency:'COP',maximumFractionDigits:0})`.

---

## File Structure

| File | Responsibility |
|------|----------------|
| `supabase/migrations/0009_demo_order_items.sql` | Give demo orders realistic per-product items (so top-products is meaningful) |
| `src/lib/metrics/dashboard.ts` | Types + pure `summarize(orders)` |
| `tests/lib/metrics/dashboard.test.ts` | summarize tests |
| `src/lib/metrics/getDashboardData.ts` | Fetch orders in range + summarize + customer count |
| `src/components/admin/charts/SalesLineChart.tsx` | Sales-over-time line (client) |
| `src/components/admin/charts/TopProductsBarChart.tsx` | Top products bar (client) |
| `src/components/admin/charts/StatusDonut.tsx` | Orders-by-status donut (client) |
| `src/components/admin/RangeSelector.tsx` | 7/30/90 link tabs (client) |
| `src/app/admin/page.tsx` | Dashboard page (replaces stub) |

---

## Task 1: Realistic demo order items

**Files:**
- Create: `supabase/migrations/0009_demo_order_items.sql`

- [ ] **Step 1: Write the migration** (controller applies via MCP)

Rewrite each demo order's `items` to reference a real product (deterministic pick by hashing the order id), quantity 1-3, so top-products aggregation is meaningful.

```sql
update orders o
set items = jsonb_build_array(
  jsonb_build_object(
    'id', p.id,
    'name', p.name,
    'price', p.price,
    'category', p.category,
    'quantity', 1 + (abs(hashtext(o.id::text)) % 3)
  )
),
total = p.price * (1 + (abs(hashtext(o.id::text)) % 3))
from products p
where o.payment_intent_id like 'demo-%'
  and p.id = (
    select id from products
    order by md5(p_inner.id::text || o.id::text) limit 1
  );
```

> If the correlated subquery is awkward, the implementer/controller may instead pick the product via offset: `order by (abs(hashtext(o.id::text || products.sku)) ) limit 1`. Goal: each demo order points at one real product with qty 1-3 and `total = price*qty`. Verify afterward that several distinct product names appear across demo orders.

- [ ] **Step 2: Apply via MCP** (`apply_migration` name `0009_demo_order_items`).

- [ ] **Step 3: Verify** — `execute_sql`: `select count(distinct items->0->>'name') from orders where payment_intent_id like 'demo-%';` → > 1 (ideally 5+).

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/0009_demo_order_items.sql
git commit -m "feat: give demo orders realistic product items"
```

---

## Task 2: summarize (TDD, pure)

**Files:**
- Create: `tests/lib/metrics/dashboard.test.ts`
- Create: `src/lib/metrics/dashboard.ts`

- [ ] **Step 1: Write failing test**

```typescript
// tests/lib/metrics/dashboard.test.ts
import { describe, it, expect } from 'vitest'
import { summarize, type OrderRow } from '@/lib/metrics/dashboard'

const orders: OrderRow[] = [
  { total: 100, status: 'paid', created_at: '2026-01-01T00:00:00Z', customer_email: 'a@x.com',
    items: [{ id: 'p1', name: 'Balón', price: 50, category: 'balon', quantity: 2 }] },
  { total: 200, status: 'paid', created_at: '2026-01-01T05:00:00Z', customer_email: 'b@x.com',
    items: [{ id: 'p2', name: 'Gorra', price: 200, category: 'merchandising', quantity: 1 }] },
  { total: 999, status: 'pending', created_at: '2026-01-02T00:00:00Z', customer_email: 'a@x.com',
    items: [{ id: 'p1', name: 'Balón', price: 50, category: 'balon', quantity: 1 }] },
]

describe('summarize', () => {
  it('computes KPIs from paid orders', () => {
    const s = summarize(orders)
    expect(s.revenue).toBe(300)        // 100 + 200 (paid only)
    expect(s.paidOrders).toBe(2)
    expect(s.avgTicket).toBe(150)      // 300 / 2
    expect(s.customers).toBe(2)        // distinct emails across ALL orders
  })

  it('groups orders by status', () => {
    const s = summarize(orders)
    expect(s.byStatus).toEqual(
      expect.arrayContaining([
        { status: 'paid', count: 2 },
        { status: 'pending', count: 1 },
      ]),
    )
  })

  it('sums sales by day (paid only)', () => {
    const s = summarize(orders)
    expect(s.salesByDay).toEqual([{ date: '2026-01-01', total: 300 }])
  })

  it('ranks top products by quantity (paid only)', () => {
    const s = summarize(orders)
    // paid: Balón x2, Gorra x1
    expect(s.topProducts[0]).toEqual({ name: 'Balón', quantity: 2 })
    expect(s.topProducts[1]).toEqual({ name: 'Gorra', quantity: 1 })
  })

  it('handles empty input', () => {
    const s = summarize([])
    expect(s).toEqual({ revenue: 0, paidOrders: 0, avgTicket: 0, customers: 0, byStatus: [], salesByDay: [], topProducts: [] })
  })
})
```

- [ ] **Step 2: Run — confirm FAIL** (`npm test -- dashboard`).

- [ ] **Step 3: Implement**

```typescript
// src/lib/metrics/dashboard.ts
export type OrderItem = { id: string; name: string; price: number; category: string; quantity: number }

export type OrderRow = {
  total: number
  status: string
  created_at: string
  customer_email: string | null
  items: OrderItem[]
}

export type DashboardData = {
  revenue: number
  paidOrders: number
  avgTicket: number
  customers: number
  byStatus: { status: string; count: number }[]
  salesByDay: { date: string; total: number }[]
  topProducts: { name: string; quantity: number }[]
}

export function summarize(orders: OrderRow[]): DashboardData {
  const paid = orders.filter((o) => o.status === 'paid')
  const revenue = paid.reduce((n, o) => n + Number(o.total), 0)
  const paidOrders = paid.length
  const avgTicket = paidOrders > 0 ? Math.round(revenue / paidOrders) : 0

  const emails = new Set(orders.map((o) => o.customer_email).filter(Boolean))
  const customers = emails.size

  const statusMap = new Map<string, number>()
  for (const o of orders) statusMap.set(o.status, (statusMap.get(o.status) ?? 0) + 1)
  const byStatus = [...statusMap.entries()].map(([status, count]) => ({ status, count }))

  const dayMap = new Map<string, number>()
  for (const o of paid) {
    const date = o.created_at.slice(0, 10)
    dayMap.set(date, (dayMap.get(date) ?? 0) + Number(o.total))
  }
  const salesByDay = [...dayMap.entries()]
    .map(([date, total]) => ({ date, total }))
    .sort((a, b) => a.date.localeCompare(b.date))

  const prodMap = new Map<string, number>()
  for (const o of paid) {
    for (const it of o.items ?? []) {
      prodMap.set(it.name, (prodMap.get(it.name) ?? 0) + Number(it.quantity))
    }
  }
  const topProducts = [...prodMap.entries()]
    .map(([name, quantity]) => ({ name, quantity }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5)

  return { revenue, paidOrders, avgTicket, customers, byStatus, salesByDay, topProducts }
}
```

- [ ] **Step 4: Run — confirm PASS** (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/metrics/dashboard.ts tests/lib/metrics/dashboard.test.ts
git commit -m "feat: add dashboard summarize aggregation"
```

---

## Task 3: getDashboardData

**Files:**
- Create: `src/lib/metrics/getDashboardData.ts`

- [ ] **Step 1: Implement**

```typescript
// src/lib/metrics/getDashboardData.ts
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/types/database'
import { summarize, type DashboardData, type OrderRow, type OrderItem } from './dashboard'

export async function getDashboardData(
  client: SupabaseClient<Database>,
  days: number,
): Promise<DashboardData> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
  const { data, error } = await client
    .from('orders')
    .select('total, status, created_at, customer_email, items')
    .gte('created_at', since)
  if (error) throw new Error(error.message)

  const rows: OrderRow[] = (data ?? []).map((o) => ({
    total: Number(o.total),
    status: o.status,
    created_at: o.created_at,
    customer_email: o.customer_email,
    items: Array.isArray(o.items) ? (o.items as unknown as OrderItem[]) : [],
  }))
  return summarize(rows)
}
```

- [ ] **Step 2: Verify** — `npx tsc --noEmit` clean.

- [ ] **Step 3: Commit**

```bash
git add src/lib/metrics/getDashboardData.ts
git commit -m "feat: add getDashboardData range fetch"
```

---

## Task 4: Chart components (Recharts client islands)

**Files:**
- Create: `src/components/admin/charts/SalesLineChart.tsx`
- Create: `src/components/admin/charts/TopProductsBarChart.tsx`
- Create: `src/components/admin/charts/StatusDonut.tsx`

> Recharts 3.x is installed. Verify the import surface (`LineChart`, `Line`, `XAxis`, `YAxis`, `Tooltip`, `ResponsiveContainer`, `BarChart`, `Bar`, `PieChart`, `Pie`, `Cell`) via node_modules types. All chart components are `'use client'` and wrapped in `ResponsiveContainer`.

- [ ] **Step 1: SalesLineChart**

```tsx
// src/components/admin/charts/SalesLineChart.tsx
'use client'

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

const cop = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })

export function SalesLineChart({ data }: { data: { date: string; total: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data} margin={{ top: 8, right: 12, left: 4, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
        <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(d: string) => d.slice(5)} />
        <YAxis tick={{ fontSize: 11 }} tickFormatter={(v: number) => `${Math.round(v / 1000)}k`} width={40} />
        <Tooltip formatter={(v: number) => cop.format(v)} labelClassName="text-xs" />
        <Line type="monotone" dataKey="total" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  )
}
```

> Note: shadcn tokens are CSS vars. If `hsl(var(--primary))` doesn't resolve to a visible color in this theme (Tailwind v4 may define `--primary` as an oklch value directly, not an HSL triple), use the resolved color: read `src/app/globals.css` for the `--primary` value and pass a concrete color (e.g. `var(--primary)` directly, or a hex). Verify the line is visible in the smoke test; adjust the stroke to a guaranteed-visible color if needed.

- [ ] **Step 2: TopProductsBarChart**

```tsx
// src/components/admin/charts/TopProductsBarChart.tsx
'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

export function TopProductsBarChart({ data }: { data: { name: string; quantity: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} layout="vertical" margin={{ top: 8, right: 12, left: 8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
        <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
        <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={110} />
        <Tooltip />
        <Bar dataKey="quantity" fill="var(--primary)" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
```

- [ ] **Step 3: StatusDonut**

```tsx
// src/components/admin/charts/StatusDonut.tsx
'use client'

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'

const COLORS: Record<string, string> = {
  paid: '#16a34a', pending: '#f59e0b', shipped: '#3b82f6', cancelled: '#ef4444',
}
const LABELS: Record<string, string> = {
  paid: 'Pagado', pending: 'Pendiente', shipped: 'Enviado', cancelled: 'Cancelado',
}

export function StatusDonut({ data }: { data: { status: string; count: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie data={data} dataKey="count" nameKey="status" innerRadius={60} outerRadius={100} paddingAngle={2}>
          {data.map((d) => <Cell key={d.status} fill={COLORS[d.status] ?? '#a1a1aa'} />)}
        </Pie>
        <Tooltip />
        <Legend formatter={(value: string) => LABELS[value] ?? value} />
      </PieChart>
    </ResponsiveContainer>
  )
}
```

- [ ] **Step 4: Verify** — `npx tsc --noEmit` clean.

- [ ] **Step 5: Commit**

```bash
git add src/components/admin/charts/
git commit -m "feat: add dashboard chart components"
```

---

## Task 5: RangeSelector + Dashboard page

**Files:**
- Create: `src/components/admin/RangeSelector.tsx`
- Modify: `src/app/admin/page.tsx`

- [ ] **Step 1: RangeSelector (client, link tabs)**

```tsx
// src/components/admin/RangeSelector.tsx
'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'

const ranges = [
  { days: 7, label: '7 días' },
  { days: 30, label: '30 días' },
  { days: 90, label: '90 días' },
]

export function RangeSelector() {
  const pathname = usePathname()
  const params = useSearchParams()
  const current = params.get('range') ?? '90'

  return (
    <div className="flex gap-1 rounded-lg border border-border p-1">
      {ranges.map((r) => (
        <Link
          key={r.days}
          href={`${pathname}?range=${r.days}`}
          className={cn(
            'rounded-md px-3 py-1 text-sm font-medium transition-colors',
            current === String(r.days)
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:bg-muted',
          )}
        >
          {r.label}
        </Link>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Dashboard page (replace `src/app/admin/page.tsx`)**

```tsx
// src/app/admin/page.tsx
import { createClient } from '@/lib/supabase/server'
import { getDashboardData } from '@/lib/metrics/getDashboardData'
import { RangeSelector } from '@/components/admin/RangeSelector'
import { SalesLineChart } from '@/components/admin/charts/SalesLineChart'
import { TopProductsBarChart } from '@/components/admin/charts/TopProductsBarChart'
import { StatusDonut } from '@/components/admin/charts/StatusDonut'

const cop = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1.5 text-2xl font-bold tabular-nums tracking-tight">{value}</p>
    </div>
  )
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <h2 className="mb-4 text-sm font-semibold text-muted-foreground">{title}</h2>
      {children}
    </div>
  )
}

const statusLabel: Record<string, string> = {
  paid: 'Pagado', pending: 'Pendiente', shipped: 'Enviado', cancelled: 'Cancelado',
}

export default async function AdminDashboard({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>
}) {
  const { range } = await searchParams
  const days = [7, 30, 90].includes(Number(range)) ? Number(range) : 90

  const supabase = await createClient()
  const data = await getDashboardData(supabase, days)

  const recent = await supabase
    .from('orders')
    .select('id, customer_email, total, status, created_at')
    .order('created_at', { ascending: false })
    .limit(5)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <RangeSelector />
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi label="Ingresos (pagado)" value={cop.format(data.revenue)} />
        <Kpi label="Órdenes pagadas" value={String(data.paidOrders)} />
        <Kpi label="Ticket promedio" value={cop.format(data.avgTicket)} />
        <Kpi label="Clientes" value={String(data.customers)} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Panel title={`Ventas (${days} días)`}>
            <SalesLineChart data={data.salesByDay} />
          </Panel>
        </div>
        <Panel title="Órdenes por estado">
          <StatusDonut data={data.byStatus} />
        </Panel>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Panel title="Top productos">
          <TopProductsBarChart data={data.topProducts} />
        </Panel>
        <Panel title="Órdenes recientes">
          <ul className="divide-y divide-border text-sm">
            {(recent.data ?? []).map((o) => (
              <li key={o.id} className="flex items-center justify-between py-2.5">
                <span className="truncate text-muted-foreground">{o.customer_email ?? '—'}</span>
                <span className="mx-3 shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs">{statusLabel[o.status] ?? o.status}</span>
                <span className="shrink-0 font-medium tabular-nums">{cop.format(Number(o.total))}</span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Verify** — `npx tsc --noEmit`, `npm run build` clean. Manual smoke as admin: `/admin` shows KPIs with real numbers, three charts render with demo data, recent orders list populated, range tabs switch (`?range=7` changes the line chart). Confirm chart lines/bars are visible (fix color tokens if invisible per Task 4 note). Stop server, free port 3000.

- [ ] **Step 4: Commit**

```bash
git add src/components/admin/RangeSelector.tsx src/app/admin/page.tsx
git commit -m "feat: add interactive CRM dashboard page"
```

---

## Self-Review

- **Spec coverage:** Design "Dashboard: KPI cards, líneas ventas 90d, barras top productos, donut estados, tabla recientes, selector rango" → all in Tasks 4-5; aggregation Tasks 2-3; meaningful demo data Task 1.
- **Placeholder scan:** No TBD. Chart color-token caveat is a verify-and-fix instruction, not a gap.
- **Type consistency:** `OrderRow`/`OrderItem`/`DashboardData` (Task 2) consumed by getDashboardData (Task 3) and the page (Task 5). Chart components take exactly the `salesByDay`/`topProducts`/`byStatus` shapes `summarize` returns.
- **Security:** Page uses the authenticated admin session (RLS "admins read all orders" lets it read everything); behind the `requireAdmin` layout. No service-role.
