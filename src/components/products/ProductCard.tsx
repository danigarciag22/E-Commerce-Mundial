import Link from 'next/link'
import type { Product } from '@/lib/products/types'
import { placeholderImage } from '@/lib/products/placeholderImage'
import { WishlistButton } from '@/components/wishlist/WishlistButton'
import { cn } from '@/lib/utils'

const cop = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
})

const categoryLabel: Record<Product['category'], string> = {
  uniforme: 'Uniforme',
  zapato: 'Botines',
  balon: 'Balón',
  merchandising: 'Merch',
}

// A subtle, category-driven gradient so the placeholder hero feels intentional
// rather than a flat gray box. Replaced by real 3D renders in Fase 2.
const categoryAccent: Record<Product['category'], string> = {
  uniforme: 'from-muted via-card to-muted/40',
  zapato: 'from-muted/60 via-card to-muted/30',
  balon: 'from-muted via-muted/30 to-card',
  merchandising: 'from-card via-muted/50 to-muted/30',
}

export function ProductCard({ product }: { product: Product }) {
  return (
    <div
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card',
        'transition-all duration-300 ease-out',
        'hover:-translate-y-1.5 hover:border-primary/30 hover:shadow-[0_18px_40px_-18px_rgba(0,0,0,0.35)]',
      )}
    >
      {/* Heart is a sibling of the Link (not nested) so saving never navigates. */}
      <WishlistButton
        product={{ id: product.id, name: product.name, price: product.price, category: product.category }}
        className="absolute right-3 top-3 z-20 opacity-0 transition-opacity duration-300 focus-visible:opacity-100 group-hover:opacity-100 aria-pressed:opacity-100"
      />

      <Link
        href={`/productos/${product.id}`}
        aria-label={`Ver ${product.name}, ${cop.format(product.price)}`}
        className="flex flex-1 flex-col rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <div
          className={cn(
            'relative aspect-square overflow-hidden bg-gradient-to-br',
            categoryAccent[product.category],
          )}
        >
          {/* Generic category placeholder art — replaced by Higgsfield 3D in Fase 2 (see docs/3D-ASSETS.md) */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={placeholderImage(product.category)}
            alt=""
            aria-hidden
            className="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          {/* Decorative pitch-line motif for World Cup energy */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[0.06] [background-image:repeating-linear-gradient(45deg,currentColor_0_1px,transparent_1px_14px)]"
          />
          <span className="absolute left-3 top-3 z-10 rounded-full bg-primary px-2.5 py-1 text-[0.7rem] font-semibold uppercase tracking-wide text-primary-foreground shadow-sm">
            {categoryLabel[product.category]}
          </span>
        </div>

        <div className="flex flex-1 flex-col gap-1 p-4">
          <h3 className="line-clamp-2 font-semibold leading-tight tracking-tight text-card-foreground">
            {product.name}
          </h3>
          <p className="mt-auto pt-3 text-lg font-bold tabular-nums text-foreground">
            {cop.format(product.price)}
          </p>
        </div>
      </Link>
    </div>
  )
}
