import { requireAdmin } from '@/lib/auth/guards'

export default async function AdminPage() {
  const user = await requireAdmin()

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
        Panel de administración
      </h1>
      <p className="mt-2 text-muted-foreground">Bienvenido, {user.email}.</p>
      <p className="mt-6 text-sm text-muted-foreground">
        (CRUD de productos y métricas — próximo plan.)
      </p>
    </main>
  )
}
