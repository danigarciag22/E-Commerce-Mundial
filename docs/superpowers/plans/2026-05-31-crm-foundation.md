# CRM Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Lay the CRM groundwork: schema changes (stock, active, collections, product_collections, discounts, orders.customer_email) with admin RLS, realistic demo data, the admin shell (collapsible sidebar + topbar), and Recharts installed — so the module plans (Dashboard, Productos/Inventario, Órdenes, Clientes, Descuentos/Colecciones) can build on it.

**Architecture:** Migrations applied via Supabase MCP by the controller. Admin pages stay under `/admin`, guarded by `requireAdmin()` in the layout; the layout becomes the CRM shell (sidebar nav + topbar). Reads/writes use the authenticated admin session + RLS admin policies (no service-role in the panel). Recharts powers later dashboards.

**Tech Stack:** Next.js 16, TypeScript, Tailwind v4, shadcn/ui, Recharts, Supabase, Vitest.

> **Verify via Context7 (key may be down → fall back to node_modules):** Recharts current version + React 19 compatibility; Next 16 layout/client-island patterns.

> **Existing (use, do NOT recreate):**
> - `src/lib/auth/guards.ts` — `requireAdmin()`.
> - `src/lib/auth/getUser.ts` — `getUser()`.
> - `src/app/admin/layout.tsx` — current simple nav shell (REPLACE with CRM shell).
> - `src/app/admin/page.tsx` — metrics stub (left as-is here; Dashboard plan replaces it).
> - `cn` at `src/lib/utils.ts`. Supabase project_id `xaffgvilsjkcpjmtreia`.

---

## File Structure

| File | Responsibility |
|------|----------------|
| `supabase/migrations/0007_crm_schema.sql` | products.stock/active, collections, product_collections, discounts, orders.customer_email + admin RLS |
| `supabase/migrations/0008_crm_demo_seed.sql` | Demo customers/orders/stock/discounts/collections |
| `src/components/admin/AdminSidebar.tsx` | Collapsible sidebar nav (client) |
| `src/components/admin/AdminTopbar.tsx` | Topbar (title slot, admin email, logout) |
| `src/app/admin/layout.tsx` | CRM shell wiring sidebar + topbar (guarded) |
| `package.json` | + recharts |

---

## Task 1: Schema migration

**Files:**
- Create: `supabase/migrations/0007_crm_schema.sql`

- [ ] **Step 1: Write the migration**

```sql
-- products: stock + active
alter table products add column if not exists stock int not null default 0;
alter table products add column if not exists active boolean not null default true;

-- orders: guest email
alter table orders add column if not exists customer_email text;

-- collections
create table if not exists collections (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique,
  description text,
  created_at  timestamptz not null default now()
);

create table if not exists product_collections (
  product_id    uuid references products(id) on delete cascade,
  collection_id uuid references collections(id) on delete cascade,
  primary key (product_id, collection_id)
);

-- discounts
create table if not exists discounts (
  id         uuid primary key default gen_random_uuid(),
  code       text not null unique,
  percent    int not null check (percent between 1 and 100),
  active      boolean not null default true,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

-- RLS
alter table collections enable row level security;
alter table product_collections enable row level security;
alter table discounts enable row level security;

-- collections + product_collections are public-readable (storefront use later)
create policy "collections readable by anyone" on collections for select using (true);
create policy "product_collections readable by anyone" on product_collections for select using (true);

-- admin full control over collections / product_collections / discounts
create policy "admins manage collections" on collections for all
  using (exists (select 1 from app_users where id = auth.uid() and role = 'admin'))
  with check (exists (select 1 from app_users where id = auth.uid() and role = 'admin'));
create policy "admins manage product_collections" on product_collections for all
  using (exists (select 1 from app_users where id = auth.uid() and role = 'admin'))
  with check (exists (select 1 from app_users where id = auth.uid() and role = 'admin'));
create policy "admins read discounts" on discounts for select
  using (exists (select 1 from app_users where id = auth.uid() and role = 'admin'));
create policy "admins manage discounts" on discounts for all
  using (exists (select 1 from app_users where id = auth.uid() and role = 'admin'))
  with check (exists (select 1 from app_users where id = auth.uid() and role = 'admin'));

-- admins can read all app_users (customers module)
create policy "admins read all profiles" on app_users for select
  using (exists (select 1 from app_users a where a.id = auth.uid() and a.role = 'admin'));
```

> Note the `app_users` admin-read policy uses alias `a` to avoid self-reference ambiguity; it coexists with the existing "users read own profile" policy (RLS is permissive OR).

- [ ] **Step 2: Apply via Supabase MCP** (`apply_migration` name `0007_crm_schema`).

- [ ] **Step 3: Verify** — `list_tables` shows `collections`, `product_collections`, `discounts`; `products` has `stock`,`active`; `orders` has `customer_email`. Run `get_advisors` (security); resolve criticals.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/0007_crm_schema.sql
git commit -m "feat: add CRM schema (stock, collections, discounts) with admin RLS"
```

---

## Task 2: Demo seed

**Files:**
- Create: `supabase/migrations/0008_crm_demo_seed.sql`

- [ ] **Step 1: Write the seed**

Idempotent where possible. Uses existing 12 products.

```sql
-- Stock for existing products (varied, some low/zero for inventory testing)
update products set stock = (10 + (abs(hashtext(sku)) % 90)) where stock = 0;
update products set stock = 3 where sku in ('BAL-FIFA-001','UNI-COL-001'); -- low stock
update products set stock = 0 where sku = 'MER-TRM-001'; -- out of stock

-- Collections
insert into collections (name, slug, description) values
  ('Selección Colombia', 'colombia', 'Todo para la tricolor'),
  ('Argentina', 'argentina', 'Campeón vigente'),
  ('Brasil', 'brasil', 'Pentacampeón'),
  ('Mundial 2026', 'mundial-2026', 'Edición del torneo'),
  ('Ofertas', 'ofertas', 'Precios especiales')
on conflict (slug) do nothing;

-- Assign products to collections by category/sku heuristics
insert into product_collections (product_id, collection_id)
select p.id, c.id from products p, collections c
where (c.slug = 'colombia' and p.sku like '%COL%')
   or (c.slug = 'argentina' and p.sku like '%ARG%')
   or (c.slug = 'brasil' and p.sku like '%BRA%')
   or (c.slug = 'mundial-2026' and p.sku like '%FIFA%')
on conflict do nothing;

-- Discounts
insert into discounts (code, percent, active, expires_at) values
  ('MUNDIAL10', 10, true, now() + interval '60 days'),
  ('HINCHA20', 20, true, now() + interval '30 days'),
  ('ENVIOGRATIS', 15, true, null),
  ('VIEJO5', 5, false, now() - interval '5 days')
on conflict (code) do nothing;

-- Demo customers (profile rows only; no auth.users — visualization data)
insert into app_users (id, email, role, created_at)
select gen_random_uuid(),
       'cliente' || g || '@demo.com',
       'customer',
       now() - (g || ' days')::interval
from generate_series(1, 15) g
on conflict do nothing;

-- Demo orders over 90 days, varied status/totals, guest (customer_email)
insert into orders (id, user_id, customer_email, items, total, status, payment_intent_id, created_at)
select
  gen_random_uuid(),
  null,
  'cliente' || (1 + (g % 15)) || '@demo.com',
  '[{"id":"demo","name":"Producto demo","price":100000,"category":"uniforme","quantity":1}]'::jsonb,
  (50000 + (abs(hashtext(g::text)) % 900000)),
  (array['paid','paid','paid','pending','shipped','cancelled'])[1 + (g % 6)],
  'demo-' || g,
  now() - ((abs(hashtext(g::text)) % 90) || ' days')::interval
from generate_series(1, 40) g;
```

> Seed is demo/visualization data: customers are `app_users` profile rows without `auth.users` (they can't log in — they exist for CRM lists); orders are guest (`customer_email`). Documented simplification. To wipe later: delete from orders where payment_intent_id like 'demo-%'; delete from app_users where email like 'cliente%@demo.com'; etc.

- [ ] **Step 2: Apply via Supabase MCP** (`apply_migration` name `0008_crm_demo_seed`).

- [ ] **Step 3: Verify** — `execute_sql`: counts — `select count(*) from orders` (≥40), `from collections` (5), `from discounts` (4), `from app_users where role='customer'` (~15), products with low stock exist.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/0008_crm_demo_seed.sql
git commit -m "feat: add CRM demo seed data"
```

---

## Task 3: Install Recharts

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install** — `npm install recharts` (verify React 19 compatible version via Context7/node_modules; if peer warns on React 19, it still works — recharts 2.x supports React 19).

- [ ] **Step 2: Verify** — `npm ls recharts` resolves; `npx tsc --noEmit` clean.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add recharts"
```

---

## Task 4: Admin shell — sidebar + topbar

**Files:**
- Create: `src/components/admin/AdminSidebar.tsx`
- Create: `src/components/admin/AdminTopbar.tsx`
- Modify: `src/app/admin/layout.tsx`

- [ ] **Step 1: AdminSidebar (client, collapsible, active link)**

```tsx
// src/components/admin/AdminSidebar.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Package, ShoppingCart, Users, Boxes, Tag, FolderTree,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const items = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/productos', label: 'Productos', icon: Package },
  { href: '/admin/ordenes', label: 'Órdenes', icon: ShoppingCart },
  { href: '/admin/clientes', label: 'Clientes', icon: Users },
  { href: '/admin/inventario', label: 'Inventario', icon: Boxes },
  { href: '/admin/descuentos', label: 'Descuentos', icon: Tag },
  { href: '/admin/colecciones', label: 'Colecciones', icon: FolderTree },
]

export function AdminSidebar() {
  const pathname = usePathname()
  return (
    <aside className="hidden w-60 shrink-0 border-r border-border bg-card md:block">
      <div className="sticky top-0 flex h-screen flex-col">
        <Link href="/" className="flex h-14 items-center gap-2 border-b border-border px-5 font-bold">
          <span className="grid size-7 place-items-center rounded-full bg-primary text-xs font-black text-primary-foreground">26</span>
          CRM
        </Link>
        <nav className="flex flex-1 flex-col gap-1 p-3">
          {items.map(({ href, label, icon: Icon, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  active ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
              >
                <Icon className="size-4" />
                {label}
              </Link>
            )
          })}
        </nav>
        <Link href="/" className="border-t border-border px-5 py-3 text-sm text-muted-foreground hover:text-foreground">
          ← Ver tienda
        </Link>
      </div>
    </aside>
  )
}
```

> Mobile drawer is a nice-to-have; this plan ships the desktop sidebar + a top nav fallback on mobile via the topbar. A full drawer can be a later polish — do NOT block on it. (On mobile the sidebar is hidden; topbar shows section title. Acceptable MVP.)

- [ ] **Step 2: AdminTopbar (server — shows admin email + logout)**

```tsx
// src/components/admin/AdminTopbar.tsx
import { getUser } from '@/lib/auth/getUser'
import { signOut } from '@/lib/auth/actions'

export async function AdminTopbar() {
  const user = await getUser()
  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-background px-4 md:px-6">
      <span className="font-semibold md:hidden">CRM</span>
      <div className="ml-auto flex items-center gap-3">
        <span className="hidden text-sm text-muted-foreground sm:inline">{user?.email}</span>
        <form action={signOut}>
          <button type="submit" className="text-sm font-medium hover:underline">Salir</button>
        </form>
      </div>
    </header>
  )
}
```

- [ ] **Step 3: Replace `src/app/admin/layout.tsx` with the shell**

```tsx
// src/app/admin/layout.tsx
import { requireAdmin } from '@/lib/auth/guards'
import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { AdminTopbar } from '@/components/admin/AdminTopbar'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin()
  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminTopbar />
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  )
}
```

> The root layout already renders a global header; the admin shell sits inside the page area. That's acceptable (a thin global header above the CRM). If it looks redundant, a later polish can hide the global header on `/admin` routes — do NOT block on it here.

- [ ] **Step 4: Verify** — `npx tsc --noEmit`, `npm run build` clean. Manual: `/admin` shows sidebar + topbar, nav links highlight active route. Stop dev server, free port 3000.

- [ ] **Step 5: Commit**

```bash
git add src/components/admin/AdminSidebar.tsx src/components/admin/AdminTopbar.tsx src/app/admin/layout.tsx
git commit -m "feat: add CRM admin shell (sidebar + topbar)"
```

---

## Self-Review

- **Spec coverage:** Design doc "Layout (sidebar/topbar)" (Task 4), "Cambios de schema" (Task 1), "Datos demo" (Task 2), Recharts (Task 3). Module pages are separate plans.
- **Placeholder scan:** No TBD. Mobile drawer + hiding global header flagged as non-blocking later polish, not silent gaps. Demo customers без auth.users documented.
- **Type consistency:** Sidebar `items` hrefs match the routes the module plans will create. Topbar uses existing `getUser`/`signOut`. Layout uses existing `requireAdmin`.
- **Security:** Layout guard unchanged (`requireAdmin`). New RLS policies gate collections/discounts/app_users admin access by role; collections/product_collections public-readable for the future storefront.
