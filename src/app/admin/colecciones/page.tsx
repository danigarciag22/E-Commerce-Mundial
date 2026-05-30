import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getCollections } from '@/lib/collections/getCollections'
import { CollectionForm } from '@/components/admin/CollectionForm'
import { DeleteButton } from '@/components/admin/DeleteButton'
import { deleteCollectionAction } from '@/lib/collections/collectionActions'

export default async function AdminCollectionsPage() {
  const supabase = await createClient()
  const collections = await getCollections(supabase)
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold tracking-tight">Colecciones</h1>
      <CollectionForm />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {collections.map((c) => (
          <div key={c.id} className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold">{c.name}</h3>
                <p className="text-xs text-muted-foreground">/{c.slug} · {c.productCount} productos</p>
              </div>
              <DeleteButton action={deleteCollectionAction} id={c.id} confirmText={`¿Eliminar la colección ${c.name}?`} />
            </div>
            {c.description && <p className="text-sm text-muted-foreground">{c.description}</p>}
            <Link href={`/admin/colecciones/${c.id}`} className="mt-auto text-sm font-medium text-primary hover:underline">Asignar productos →</Link>
          </div>
        ))}
        {collections.length === 0 && <p className="text-muted-foreground">Sin colecciones.</p>}
      </div>
    </div>
  )
}
