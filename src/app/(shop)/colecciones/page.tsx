import Link from 'next/link'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { getPublicCollections } from '@/lib/collections/getPublicCollections'

export const metadata: Metadata = { title: 'Colecciones | Tienda Mundial 2026' }

export default async function CollectionsPage() {
  const supabase = await createClient()
  const collections = await getPublicCollections(supabase)
  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight">Colecciones</h1>
      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {collections.map((c) => (
          <Link key={c.id} href={`/colecciones/${c.slug}`}
            className="group flex flex-col justify-between gap-6 overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-muted via-card to-muted/40 p-6 transition hover:-translate-y-1 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Colección</span>
            <div>
              <h2 className="text-xl font-bold">{c.name}</h2>
              {c.description && <p className="mt-1 text-sm text-muted-foreground">{c.description}</p>}
              <span className="mt-4 inline-block text-sm font-medium text-primary">Ver productos →</span>
            </div>
          </Link>
        ))}
      </div>
    </main>
  )
}
