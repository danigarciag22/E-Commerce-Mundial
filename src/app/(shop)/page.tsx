import { Suspense } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getProducts } from '@/lib/products/getProducts'
import { parseFilters } from '@/lib/products/filterParams'
import { getPublicCollections } from '@/lib/collections/getPublicCollections'
import { ProductGrid } from '@/components/products/ProductGrid'
import { CategoryFilter } from '@/components/products/CategoryFilter'
import { HeroMedia } from '@/components/storefront/HeroMedia'

type SearchParams = Record<string, string | string[] | undefined>

export default async function HomePage({
  searchParams,
}: {
  // Next.js 16: searchParams is async (a Promise) and must be awaited.
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const filters = parseFilters(params)
  const supabase = await createClient()
  const [products, collections] = await Promise.all([
    getProducts(supabase, filters),
    getPublicCollections(supabase),
  ])

  return (
    <>
      <section className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-12 sm:px-6 lg:grid-cols-2 lg:py-20 lg:px-8">
        <div className="flex flex-col gap-6">
          <span className="w-fit rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">Mundial 2026</span>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Vive el Mundial con la camiseta puesta</h1>
          <p className="text-lg text-muted-foreground">Uniformes, botines, balones y merch oficial de tu selección. Envíos a todo Colombia.</p>
          <div className="flex flex-wrap gap-3">
            <Link href="#catalogo" className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background">Ver productos</Link>
            <Link href="/colecciones" className="rounded-full border border-border px-6 py-3 text-sm font-semibold transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background">Colecciones</Link>
          </div>
        </div>
        <HeroMedia />
      </section>

      {collections.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pb-4 sm:px-6 lg:px-8">
          <h2 className="mb-4 text-xl font-bold tracking-tight">Colecciones destacadas</h2>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {collections.slice(0, 4).map((c) => (
              <Link key={c.id} href={`/colecciones/${c.slug}`} className="rounded-xl border border-border bg-card p-5 transition hover:-translate-y-1 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background">
                <span className="text-xs uppercase tracking-wide text-muted-foreground">Colección</span>
                <p className="mt-1 font-semibold">{c.name}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section id="catalogo" className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold tracking-tight">Catálogo</h2>
        <div className="my-6">
          <Suspense
            fallback={<div className="h-10 w-full max-w-md animate-pulse rounded-full bg-muted" />}
          >
            <CategoryFilter />
          </Suspense>
        </div>
        <ProductGrid products={products} />
      </section>
    </>
  )
}
