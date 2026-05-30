import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getProducts } from '@/lib/products/getProducts'
import { getCollection, getAssignedProductIds } from '@/lib/collections/getCollections'
import { setCollectionProductsAction } from '@/lib/collections/collectionActions'

export default async function CollectionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const collection = await getCollection(supabase, id)
  if (!collection) notFound()
  const [products, assigned] = await Promise.all([
    getProducts(supabase),
    getAssignedProductIds(supabase, id),
  ])
  const assignedSet = new Set(assigned)

  return (
    <div className="flex flex-col gap-6">
      <Link href="/admin/colecciones" className="text-sm text-muted-foreground hover:underline">← Colecciones</Link>
      <h1 className="text-2xl font-bold tracking-tight">{collection.name}</h1>
      <form action={setCollectionProductsAction} className="flex flex-col gap-4">
        <input type="hidden" name="collection_id" value={id} />
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {products.map((p) => (
            <label key={p.id} className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm">
              <input type="checkbox" name="product_id" value={p.id} defaultChecked={assignedSet.has(p.id)} />
              {p.name} <span className="text-muted-foreground">· {p.category}</span>
            </label>
          ))}
        </div>
        <button type="submit" className="w-fit rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90">Guardar selección</button>
      </form>
    </div>
  )
}
