import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getProductById } from '@/lib/products/getProductById'
import { ProductForm } from '@/components/admin/ProductForm'
import { updateProductAction } from '@/lib/products/productActions'

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const product = await getProductById(supabase, id)
  if (!product) notFound()

  const action = updateProductAction.bind(null, id)

  return (
    <main>
      <h1 className="mb-6 text-2xl font-bold tracking-tight sm:text-3xl">Editar producto</h1>
      <ProductForm
        action={action}
        defaults={{
          name: product.name,
          sku: product.sku,
          price: product.price,
          category: product.category,
          description: product.description,
          stock: product.stock,
          active: product.active,
        }}
        submitLabel="Guardar cambios"
      />
    </main>
  )
}
