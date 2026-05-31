import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { getCollectionBySlug, getCollectionProducts } from '@/lib/collections/getPublicCollections'
import { ProductGrid } from '@/components/products/ProductGrid'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()
  const c = await getCollectionBySlug(supabase, slug)
  return { title: c ? `${c.name} | Tienda Mundial 2026` : 'Colección' }
}

export default async function CollectionDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()
  const collection = await getCollectionBySlug(supabase, slug)
  if (!collection) notFound()
  const products = await getCollectionProducts(supabase, collection.id)

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <Link href="/colecciones" className="text-sm text-muted-foreground hover:underline">← Colecciones</Link>
      <h1 className="mt-4 text-3xl font-bold tracking-tight">{collection.name}</h1>
      {collection.description && <p className="mt-2 text-muted-foreground">{collection.description}</p>}
      <div className="mt-8"><ProductGrid products={products} /></div>
    </main>
  )
}
