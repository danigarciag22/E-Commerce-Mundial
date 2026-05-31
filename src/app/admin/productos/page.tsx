import { requirePermission } from '@/lib/auth/guards'
import { createClient } from '@/lib/supabase/server'
import { getProducts } from '@/lib/products/getProducts'
import { ProductsTable } from '@/components/admin/ProductsTable'

export default async function AdminProductsPage() {
  await requirePermission('manage_products')
  const supabase = await createClient()
  const products = await getProducts(supabase)
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold tracking-tight">Productos</h1>
      <ProductsTable products={products} />
    </div>
  )
}
