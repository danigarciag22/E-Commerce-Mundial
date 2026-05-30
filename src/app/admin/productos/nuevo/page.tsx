import { ProductForm } from '@/components/admin/ProductForm'
import { createProductAction } from '@/lib/products/productActions'

export default function NewProductPage() {
  return (
    <main>
      <h1 className="mb-6 text-2xl font-bold tracking-tight sm:text-3xl">Nuevo producto</h1>
      <ProductForm action={createProductAction} submitLabel="Crear producto" />
    </main>
  )
}
