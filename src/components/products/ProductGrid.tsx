import type { Product } from '@/lib/products/types'
import { ProductCard } from './ProductCard'

export function ProductGrid({ products }: { products: Product[] }) {
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border py-20 text-center">
        <p className="text-base font-medium text-foreground">
          No hay productos que coincidan con tu búsqueda.
        </p>
        <p className="text-sm text-muted-foreground">
          Prueba con otra categoría o quita los filtros.
        </p>
      </div>
    )
  }

  return (
    <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((product) => (
        <li key={product.id} className="contents">
          <ProductCard product={product} />
        </li>
      ))}
    </ul>
  )
}
