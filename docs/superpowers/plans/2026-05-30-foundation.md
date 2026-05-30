# Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scaffold the Next.js + TypeScript + Tailwind app, wire it to Supabase (Postgres + Auth + Storage), create the core database schema, and get a verified deploy on Vercel.

**Architecture:** Next.js App Router monorepo-style single app. Supabase as managed Postgres + Auth + Storage. Typed Supabase client shared across server and client components. Database schema created via SQL migration. Deploy target is Vercel with env-injected Supabase keys.

**Tech Stack:** Next.js (App Router), TypeScript, Tailwind, shadcn/ui, Supabase JS SDK, zustand, Vitest, Playwright, Vercel.

> **Version note:** Do NOT pin versions from memory. Before each install/config step, use Context7 (`resolve-library-id` then `query-docs`) to confirm the current API for: `next`, `@supabase/supabase-js`, `@supabase/ssr`, `tailwindcss`, `shadcn`, `vitest`, `@playwright/test`. The commands below use `@latest`; if Context7 shows a changed flag or API, follow Context7.

> **Secrets:** Never commit real keys. All Supabase keys go in `.env.local` (gitignored) and Vercel env vars. The plan references env var NAMES only.

---

## File Structure

| File | Responsibility |
|------|----------------|
| `package.json` | Deps + scripts |
| `.env.local` | Supabase URL + keys (gitignored, NOT committed) |
| `.env.example` | Documents required env var names (committed) |
| `src/lib/supabase/client.ts` | Browser Supabase client |
| `src/lib/supabase/server.ts` | Server Supabase client (cookies-aware) |
| `src/lib/types/database.ts` | Generated Supabase types |
| `src/lib/products/getProducts.ts` | Product query helper (first real domain code) |
| `supabase/migrations/0001_init.sql` | Core schema: products, product_3d, orders, users |
| `vitest.config.ts` | Vitest config |
| `tests/lib/products/getProducts.test.ts` | Unit test for product helper |
| `tests/e2e/home.spec.ts` | Playwright smoke test |

---

## Task 1: Scaffold Next.js app

**Files:**
- Create: whole project skeleton (Next.js generates it)

- [ ] **Step 1: Confirm current scaffold flags via Context7**

Use Context7: `resolve-library-id` for "next.js", then `query-docs` topic "create-next-app App Router TypeScript Tailwind". Confirm flags below are still valid.

- [ ] **Step 2: Run the scaffolder into the current directory**

The repo already has `docs/` and a git history. Scaffold in place:

```bash
cd ~/developer/e-commerce
npx create-next-app@latest . --typescript --tailwind --app --src-dir --eslint --import-alias "@/*" --use-npm --no-turbopack
```

If it refuses because the dir is non-empty, scaffold into a temp dir and move files in:

```bash
npx create-next-app@latest .next-scaffold --typescript --tailwind --app --src-dir --eslint --import-alias "@/*" --use-npm --no-turbopack
cp -r .next-scaffold/. . && rm -rf .next-scaffold
```

- [ ] **Step 3: Verify dev server boots**

Run: `npm run dev`
Expected: server starts, `http://localhost:3000` returns the Next.js starter page. Stop with Ctrl-C.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: scaffold Next.js app with TypeScript and Tailwind"
```

---

## Task 2: Install core dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Confirm package names via Context7**

Use Context7 to confirm current package names for Supabase SSR (`@supabase/ssr` + `@supabase/supabase-js`), zustand, and shadcn CLI.

- [ ] **Step 2: Install runtime + dev deps**

```bash
npm install @supabase/supabase-js @supabase/ssr zustand
npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom @playwright/test
```

- [ ] **Step 3: Init shadcn/ui**

```bash
npx shadcn@latest init
```
Accept defaults aligned to: TypeScript yes, Tailwind, `@/components` alias, CSS variables.

- [ ] **Step 4: Verify install**

Run: `npm ls @supabase/supabase-js zustand vitest`
Expected: all three resolve with no `UNMET DEPENDENCY`.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: add supabase, zustand, vitest, playwright, shadcn"
```

---

## Task 3: Configure environment variables

**Files:**
- Create: `.env.example`
- Create: `.env.local` (gitignored — do NOT commit)

- [ ] **Step 1: Create `.env.example` (committed, no real values)**

```bash
cat > .env.example <<'EOF'
# Supabase — from Project Settings > API
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Higgsfield (3D assets) — added in Fase 2
HIGGSFIELD_API_KEY=

# Payments — added in checkout plan
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
EOF
```

- [ ] **Step 2: Create `.env.local` with real values from Supabase**

Get values from the Supabase MCP (`get_project_url`, `get_publishable_keys`) or the Supabase dashboard. Write them into `.env.local`. This file MUST stay gitignored.

- [ ] **Step 3: Verify `.env.local` is gitignored**

Run: `git check-ignore .env.local`
Expected: prints `.env.local` (meaning it IS ignored). If it prints nothing, add `.env*.local` to `.gitignore`.

- [ ] **Step 4: Commit (only the example file)**

```bash
git add .env.example .gitignore
git commit -m "chore: document required env vars"
```

---

## Task 4: Create Supabase project + core schema

**Files:**
- Create: `supabase/migrations/0001_init.sql`

- [ ] **Step 1: Ensure a Supabase project exists**

Use Supabase MCP: `list_projects`. If none suitable, `create_project` (confirm cost first with `get_cost` / `confirm_cost`).

- [ ] **Step 2: Write the migration**

```bash
mkdir -p supabase/migrations
cat > supabase/migrations/0001_init.sql <<'EOF'
-- Core schema for ecommerce futbol mundial

create table if not exists products (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  sku         text not null unique,
  price       numeric(12,2) not null check (price >= 0),
  description text,
  category    text not null check (category in ('uniforme','zapato','balon','merchandising')),
  created_at  timestamptz not null default now()
);

create table if not exists product_3d (
  product_id      uuid primary key references products(id) on delete cascade,
  model_url       text,
  background_url  text,
  lighting_preset text
);

create table if not exists app_users (
  id         uuid primary key references auth.users(id) on delete cascade,
  email      text not null,
  role       text not null default 'customer' check (role in ('admin','customer')),
  created_at timestamptz not null default now()
);

create table if not exists orders (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid references app_users(id),
  items             jsonb not null,
  total             numeric(12,2) not null check (total >= 0),
  status            text not null default 'pending'
                    check (status in ('pending','paid','shipped','cancelled')),
  payment_intent_id text,
  created_at        timestamptz not null default now()
);

-- Row Level Security
alter table products  enable row level security;
alter table orders    enable row level security;
alter table app_users enable row level security;

-- Public can read products
create policy "products are readable by anyone"
  on products for select using (true);

-- Users see only their own orders
create policy "users read own orders"
  on orders for select using (auth.uid() = user_id);

-- Users read own profile
create policy "users read own profile"
  on app_users for select using (auth.uid() = id);
EOF
```

- [ ] **Step 3: Apply the migration**

Use Supabase MCP `apply_migration` with name `0001_init` and the SQL above.

- [ ] **Step 4: Verify schema landed**

Use Supabase MCP `list_tables`.
Expected: `products`, `product_3d`, `app_users`, `orders` all present.
Also run `get_advisors` (type: security) and resolve any critical findings.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/0001_init.sql
git commit -m "feat: add core database schema migration"
```

---

## Task 5: Typed Supabase clients

**Files:**
- Create: `src/lib/types/database.ts`
- Create: `src/lib/supabase/client.ts`
- Create: `src/lib/supabase/server.ts`

- [ ] **Step 1: Generate types from the live schema**

Use Supabase MCP `generate_typescript_types` and write the output to `src/lib/types/database.ts`.

- [ ] **Step 2: Confirm `@supabase/ssr` API via Context7**

`createBrowserClient` / `createServerClient` signatures and cookie handling change between versions. Confirm current usage via Context7 before writing the two files below.

- [ ] **Step 3: Write the browser client**

```typescript
// src/lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/lib/types/database'

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}
```

- [ ] **Step 4: Write the server client**

```typescript
// src/lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/lib/types/database'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            )
          } catch {
            // called from a Server Component — safe to ignore
          }
        },
      },
    },
  )
}
```

- [ ] **Step 5: Verify it type-checks**

Run: `npx tsc --noEmit`
Expected: no errors referencing the supabase files.

- [ ] **Step 6: Commit**

```bash
git add src/lib/types/database.ts src/lib/supabase/
git commit -m "feat: add typed supabase browser and server clients"
```

---

## Task 6: First domain helper with a test (TDD)

**Files:**
- Create: `vitest.config.ts`
- Create: `tests/lib/products/getProducts.test.ts`
- Create: `src/lib/products/getProducts.ts`

- [ ] **Step 1: Configure Vitest**

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
```

Add to `package.json` scripts: `"test": "vitest run"`, `"test:watch": "vitest"`.

- [ ] **Step 2: Write the failing test**

`getProducts` maps raw Supabase rows to a clean `Product` shape. We test the mapping with an injected fake client so the test needs no network.

```typescript
// tests/lib/products/getProducts.test.ts
import { describe, it, expect } from 'vitest'
import { getProducts } from '@/lib/products/getProducts'

function fakeClient(rows: unknown[]) {
  return {
    from() {
      return {
        select() {
          return Promise.resolve({ data: rows, error: null })
        },
      }
    },
  } as never
}

describe('getProducts', () => {
  it('maps rows to Product objects', async () => {
    const client = fakeClient([
      { id: '1', name: 'Balón', sku: 'B-1', price: '50.00', description: null, category: 'balon', created_at: 'x' },
    ])
    const result = await getProducts(client)
    expect(result).toEqual([
      { id: '1', name: 'Balón', sku: 'B-1', price: 50, description: null, category: 'balon' },
    ])
  })

  it('returns empty array when there are no rows', async () => {
    const result = await getProducts(fakeClient([]))
    expect(result).toEqual([])
  })
})
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm test -- getProducts`
Expected: FAIL with "Cannot find module '@/lib/products/getProducts'".

- [ ] **Step 4: Write minimal implementation**

```typescript
// src/lib/products/getProducts.ts
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/types/database'

export type Product = {
  id: string
  name: string
  sku: string
  price: number
  description: string | null
  category: string
}

export async function getProducts(
  client: SupabaseClient<Database>,
): Promise<Product[]> {
  const { data, error } = await client.from('products').select('*')
  if (error) throw error
  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    sku: row.sku,
    price: Number(row.price),
    description: row.description,
    category: row.category,
  }))
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test -- getProducts`
Expected: PASS (2 tests).

- [ ] **Step 6: Commit**

```bash
git add vitest.config.ts tests/lib/products/ src/lib/products/ package.json
git commit -m "feat: add getProducts helper with tests"
```

---

## Task 7: Playwright smoke test

**Files:**
- Create: `playwright.config.ts`
- Create: `tests/e2e/home.spec.ts`

- [ ] **Step 1: Init Playwright config (confirm current API via Context7)**

```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
  },
  use: { baseURL: 'http://localhost:3000' },
})
```

- [ ] **Step 2: Write the smoke test**

```typescript
// tests/e2e/home.spec.ts
import { test, expect } from '@playwright/test'

test('home page responds', async ({ page }) => {
  const response = await page.goto('/')
  expect(response?.status()).toBeLessThan(400)
})
```

- [ ] **Step 3: Install browsers and run**

```bash
npx playwright install chromium
npx playwright test
```
Expected: 1 passed.

- [ ] **Step 4: Commit**

```bash
git add playwright.config.ts tests/e2e/
git commit -m "test: add playwright home smoke test"
```

---

## Task 8: Deploy to Vercel

**Files:**
- None (config via Vercel)

- [ ] **Step 1: Deploy**

Use Vercel MCP `deploy_to_vercel`, or `npx vercel`. Link the repo as a new project.

- [ ] **Step 2: Set env vars on Vercel**

Add `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (from `.env.local`) to the Vercel project (Production + Preview).

- [ ] **Step 3: Verify the deploy**

Use Vercel MCP `get_deployment` / `get_deployment_build_logs`. Confirm build succeeded and the production URL returns the app (status < 400).

- [ ] **Step 4: Commit any config**

```bash
git add -A
git commit -m "chore: configure vercel deploy" --allow-empty
```

---

## Self-Review

- **Spec coverage:** Foundation slice of the design doc — Next.js + TS + Tailwind + shadcn (Task 1-2), Supabase Postgres/Auth/Storage wiring (Task 3-5), core schema with RLS (Task 4), Vercel deploy (Task 8), test harness (Task 6-7). Products/cart/checkout/auth UI are intentionally OUT — they are separate plans.
- **Placeholder scan:** No TBD/TODO. Every code step has full code. Version specifics deferred to Context7 by design (greenfield, version-agnostic per user instruction).
- **Type consistency:** `Product` type defined in Task 6 matches columns from the Task 4 migration (`id, name, sku, price, description, category`). `Database` type (Task 5) used consistently in clients and helper.
