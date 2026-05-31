import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { searchProducts } from '@/lib/products/searchProducts'
import { ProductGrid } from '@/components/products/ProductGrid'

export const metadata: Metadata = { title: 'Buscar | Tienda Mundial 2026' }

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams
  const query = (q ?? '').trim()
  const supabase = await createClient()
  const products = query ? await searchProducts(supabase, query) : []

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold tracking-tight">
        {query ? `Resultados para “${query}”` : 'Buscar'}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {query ? `${products.length} producto(s)` : 'Escribe en la barra de búsqueda para encontrar productos.'}
      </p>
      <div className="mt-8">
        {query && <ProductGrid products={products} />}
      </div>
    </main>
  )
}
