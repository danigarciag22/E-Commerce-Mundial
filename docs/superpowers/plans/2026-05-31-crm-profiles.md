# CRM Profiles + Avatars Implementation Plan (Plan B)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Worker profiles: each team member sets a display name and uploads a photo (Supabase Storage), sees a profile card with their role badge at `/admin/perfil`, and their avatar shows in the CRM topbar and team list.

**Architecture:** `app_users` gains `full_name` + `avatar_url`. A public `avatars` Storage bucket holds photos under `{uid}/...` (Storage RLS: anyone reads, the owner writes their folder). A Server Action receives the form (name + optional file via FormData), uploads the file with the user's session client, stores the public URL, updates the row. `getUser()` returns name + avatar. The profile card + topbar + team list render the avatar (fallback to initials).

**Tech Stack:** Next.js 16 (Server Actions w/ File FormData), TypeScript, Supabase Storage, Tailwind/shadcn, Vitest, Playwright.

> **Existing (use, EXTEND — do NOT recreate):**
> - `src/lib/auth/getUser.ts` — `getUser()` → `AuthUser {id,email,profile}`. EXTEND to also return `name`, `avatarUrl`.
> - `src/lib/auth/guards.ts` — `requireCrm`.
> - `src/lib/auth/roles.ts` — `ROLE_LABELS`, `UserRole`.
> - `src/components/admin/AdminTopbar.tsx` — show avatar.
> - `src/lib/team/getTeam.ts` + `src/app/admin/equipo/page.tsx` — show avatar/name.
> - `src/lib/supabase/server.ts` (`createClient`). `cn`.

---

## File Structure

| File | Responsibility |
|------|----------------|
| `supabase/migrations/0015_profiles_avatars.sql` | columns + avatars bucket + storage RLS |
| `src/lib/types/database.ts` | regenerated (controller) |
| `src/lib/auth/getUser.ts` | return name + avatarUrl |
| `src/lib/profile/initials.ts` | pure `initials(name,email)` |
| `tests/lib/profile/initials.test.ts` | tests |
| `src/components/admin/Avatar.tsx` | avatar w/ image-or-initials fallback |
| `src/lib/profile/profileActions.ts` | `updateProfileAction` (name + upload) |
| `src/app/admin/perfil/page.tsx` | profile card + form |
| `src/components/admin/AdminTopbar.tsx` | avatar in topbar |
| `src/lib/team/getTeam.ts` + equipo page | avatar/name in team |
| `tests/e2e/admin-profile.spec.ts` | E2E (skips without creds) |

---

## Task 1: Columns + Storage bucket + RLS (controller via MCP)

**Files:** `supabase/migrations/0015_profiles_avatars.sql`

- [ ] **Step 1: Write**

```sql
alter table app_users add column if not exists full_name text;
alter table app_users add column if not exists avatar_url text;

insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Storage RLS (storage.objects already has RLS enabled in Supabase)
drop policy if exists "avatars public read" on storage.objects;
create policy "avatars public read" on storage.objects for select
  using (bucket_id = 'avatars');

drop policy if exists "avatars owner insert" on storage.objects;
create policy "avatars owner insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "avatars owner update" on storage.objects;
create policy "avatars owner update" on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
```

- [ ] **Step 2: Apply via MCP** (`apply_migration` `0015_profiles_avatars`).
- [ ] **Step 3: Regenerate types** (controller `generate_typescript_types` → write `src/lib/types/database.ts`).
- [ ] **Step 4: Verify** — `get_advisors` (security) no new criticals; `app_users` has `full_name`/`avatar_url`; bucket `avatars` exists.
- [ ] **Step 5: Commit** `feat: add profile columns and avatars storage bucket`.

---

## Task 2: initials helper (TDD, pure)

**Files:** `tests/lib/profile/initials.test.ts`, `src/lib/profile/initials.ts`

- [ ] **Step 1: Failing test**

```typescript
// tests/lib/profile/initials.test.ts
import { describe, it, expect } from 'vitest'
import { initials } from '@/lib/profile/initials'

describe('initials', () => {
  it('uses two initials from a full name', () => {
    expect(initials('Daniel García', 'x@y.com')).toBe('DG')
  })
  it('uses one initial for a single name', () => {
    expect(initials('Messi', 'x@y.com')).toBe('M')
  })
  it('falls back to the email when name is empty', () => {
    expect(initials(null, 'pedro@y.com')).toBe('P')
    expect(initials('', 'pedro@y.com')).toBe('P')
  })
  it('uppercases', () => {
    expect(initials('ana lopez', 'x@y.com')).toBe('AL')
  })
})
```

- [ ] **Step 2: Run — FAIL**.
- [ ] **Step 3: Implement**

```typescript
// src/lib/profile/initials.ts
export function initials(name: string | null, email: string): string {
  const source = (name ?? '').trim()
  if (source) {
    const parts = source.split(/\s+/).slice(0, 2)
    return parts.map((p) => p[0]?.toUpperCase() ?? '').join('')
  }
  return (email.trim()[0] ?? '?').toUpperCase()
}
```

- [ ] **Step 4: Run — PASS** (4 tests). **Step 5: Commit** `feat: add initials helper`.

---

## Task 3: getUser returns name + avatar

**Files:** `src/lib/auth/getUser.ts`

- [ ] **Step 1: Extend**

Add `name: string | null` and `avatarUrl: string | null` to `AuthUser`. Change the `app_users` select to `'id, email, role, full_name, avatar_url'`. Populate `name: profile?.full_name ?? null`, `avatarUrl: profile?.avatar_url ?? null`. Keep `profile` as `{id,email,role}` (unchanged shape — map only those three into it; read the two new columns for the top-level fields).

- [ ] **Step 2: Verify** — `npx tsc --noEmit` clean. **Step 3: Commit** `feat: return name and avatar from getUser`.

---

## Task 4: Avatar component

**Files:** `src/components/admin/Avatar.tsx`

- [ ] **Step 1: Implement (server-safe, no client hooks)**

```tsx
// src/components/admin/Avatar.tsx
import { initials } from '@/lib/profile/initials'
import { cn } from '@/lib/utils'

export function Avatar({ name, email, src, size = 36, className }: {
  name: string | null; email: string; src?: string | null; size?: number; className?: string
}) {
  const dim = { width: size, height: size }
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={name ?? email} style={dim} className={cn('rounded-full object-cover', className)} />
  }
  return (
    <span style={dim} className={cn('grid place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary', className)}>
      {initials(name, email)}
    </span>
  )
}
```

- [ ] **Step 2: Verify** tsc clean. **Step 3: Commit** `feat: add avatar component`.

---

## Task 5: profileActions + profile page

**Files:** `src/lib/profile/profileActions.ts`, `src/app/admin/perfil/page.tsx`

- [ ] **Step 1: updateProfileAction (name + optional avatar upload)**

```typescript
// src/lib/profile/profileActions.ts
'use server'

import { revalidatePath } from 'next/cache'
import { requireCrm } from '@/lib/auth/guards'
import { createClient } from '@/lib/supabase/server'

export type ProfileState = { ok?: boolean; error?: string } | null

export async function updateProfileAction(_prev: ProfileState, formData: FormData): Promise<ProfileState> {
  const user = await requireCrm()
  const fullName = String(formData.get('full_name') ?? '').trim() || null
  const supabase = await createClient()

  let avatarUrl: string | undefined
  const file = formData.get('avatar')
  if (file instanceof File && file.size > 0) {
    if (!file.type.startsWith('image/')) return { error: 'El archivo debe ser una imagen' }
    if (file.size > 2 * 1024 * 1024) return { error: 'La imagen debe pesar menos de 2 MB' }
    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'png'
    const path = `${user.id}/avatar.${ext}`
    const { error: upErr } = await supabase.storage.from('avatars').upload(path, file, { upsert: true, contentType: file.type })
    if (upErr) return { error: 'No se pudo subir la imagen' }
    const { data: pub } = supabase.storage.from('avatars').getPublicUrl(path)
    // cache-bust so the new image shows immediately
    avatarUrl = `${pub.publicUrl}?v=${Date.now()}`
  }

  const update: { full_name: string | null; avatar_url?: string } = { full_name: fullName }
  if (avatarUrl) update.avatar_url = avatarUrl
  const { error } = await supabase.from('app_users').update(update).eq('id', user.id)
  if (error) return { error: 'No se pudo guardar el perfil' }

  revalidatePath('/admin/perfil')
  revalidatePath('/admin', 'layout')
  return { ok: true }
}
```

> RLS: a user updating their OWN app_users row — current policies allow admin update (Plan A) + "users read own". There is NO self-update policy for non-admin team members, so manager/staff/viewer updating their own row would be blocked. ADD a self-update policy in this task's migration step OR here. To keep it simple, add to migration 0015: `create policy "users update own profile" on app_users for update using (auth.uid() = id) with check (auth.uid() = id and role = (select role from app_users where id = auth.uid()));` — i.e. users may update their own row but NOT change their own role. IMPLEMENTER/CONTROLLER: include this policy when applying 0015 (add it to the SQL). The `update` here only sets full_name/avatar_url (never role), so it satisfies the check.

- [ ] **Step 2: Profile page (card + form)**

```tsx
// src/app/admin/perfil/page.tsx
'use client'
// NOTE: this page reads the session via a server wrapper — implement as a Server Component
// that fetches getUser() and passes data to a small client form. See structure below.
```

Implement `perfil/page.tsx` as a **Server Component**: `const user = await requireCrm()`. Render a profile card (Avatar size 80, `user.name ?? user.email`, email, role badge `ROLE_LABELS[user.profile!.role]`) and a client `<ProfileForm defaultName={user.name} />` (separate client component using `useActionState(updateProfileAction, null)` with a text input `full_name` and a file input `avatar` (`accept="image/*"`), submit "Guardar perfil", success/error messages). Put `ProfileForm` in `src/components/admin/ProfileForm.tsx`.

- [ ] **Step 3: Verify** — `npx tsc --noEmit`, `npm run build` clean. Smoke as admin: `/admin/perfil` shows the card with role badge; set a name + upload an image → saved, avatar appears; reload persists. Stop server, free port.
- [ ] **Step 4: Commit** `feat: add profile page with avatar upload`.

---

## Task 6: Avatar in topbar + team list

**Files:** `src/components/admin/AdminTopbar.tsx`, `src/lib/team/getTeam.ts`, `src/app/admin/equipo/page.tsx`

- [ ] **Step 1: Topbar** — show `<Avatar name={user.name} email={user.email} src={user.avatarUrl} size={32} />` + a "Perfil" link to `/admin/perfil` next to the email. (Topbar already calls `getUser()`.)

- [ ] **Step 2: getTeam** — add `full_name, avatar_url` to the select and to `Member` (`name: string | null; avatarUrl: string | null`).

- [ ] **Step 3: Equipo page** — show `<Avatar>` + name (fallback email) in each row.

- [ ] **Step 4: Verify** — `npx tsc --noEmit`, `npm run build` clean. Smoke: topbar shows avatar/initials + Perfil link; team rows show avatars. Stop server, free port.
- [ ] **Step 5: Commit** `feat: show avatars in topbar and team`.

---

## Task 7: E2E (skips without creds)

**Files:** `tests/e2e/admin-profile.spec.ts`

- [ ] **Step 1: Write** — skip-guard; login admin; `/admin/perfil` shows heading + role badge text (e.g. "Administrador") + a "Guardar perfil" button. (Do not upload a file in e2e — just assert the card/form render.)

```typescript
import { test, expect } from '@playwright/test'

const email = process.env.E2E_ADMIN_EMAIL
const password = process.env.E2E_ADMIN_PASSWORD
test.skip(!email || !password, 'needs E2E_ADMIN_EMAIL/PASSWORD')

test('profile page shows card and form', async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel('Correo').fill(email!)
  await page.getByLabel('Contraseña').fill(password!)
  await page.getByRole('button', { name: /Entrar/i }).click()
  await expect(page.getByRole('button', { name: /Salir/i })).toBeVisible()
  await page.goto('/admin/perfil')
  await expect(page.getByRole('heading', { name: /Perfil/i })).toBeVisible()
  await expect(page.getByText('Administrador')).toBeVisible()
  await expect(page.getByRole('button', { name: /Guardar perfil/i })).toBeVisible()
})
```

- [ ] **Step 2: Run** — skips without creds; full suite pass/skip; port free. **Step 3: Commit** `test: add admin profile e2e (skips without creds)`.

---

## Self-Review

- **Spec coverage:** Profile columns + storage (Task 1), avatar component + initials (Tasks 2,4), profile page w/ upload + role card (Task 5), avatar in topbar/team (Task 6), E2E (Task 7).
- **Placeholder scan:** No TBD. Self-update RLS policy explicitly added (Task 5 note) so non-admin members can edit their own name/photo without changing their role.
- **Type consistency:** `getUser` adds `name`/`avatarUrl` used by Avatar/topbar/profile. `Member` gains the same. `ProfileState` consumed by `ProfileForm`.
- **Security:** Upload via the user's session to `{uid}/...`; Storage RLS restricts writes to the owner's folder; bucket is public-read (avatars are non-sensitive). Self profile update can't change role (RLS check pins role); only admin changes roles (Plan A).
