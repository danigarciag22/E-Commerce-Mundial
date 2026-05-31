import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import type { Product } from '@/lib/products/types'
import { placeholderImage } from '@/lib/products/placeholderImage'
import { cn } from '@/lib/utils'

const cop = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
})

const categoryAccent: Record<Product['category'], string> = {
  uniforme: 'from-muted via-card to-muted/40',
  zapato: 'from-muted/60 via-card to-muted/30',
  balon: 'from-muted via-muted/30 to-card',
  merchandising: 'from-card via-muted/50 to-muted/30',
}

export function RelatedProducts({ products }: { products: Product[] }) {
  if (products.length === 0) return null

  return (
    <section
      aria-labelledby="cross-sell-heading"
      className="mt-16 border-t border-border pt-10"
    >
      <div className="flex flex-col gap-1">
        <h2
          id="cross-sell-heading"
          className="text-2xl font-bold tracking-tight text-foreground"
        >
          Completa el look
        </h2>
        <p className="text-sm text-muted-foreground">Recomendaciones personalizadas para ti</p>
      </div>

      <ul className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <li
            key={product.id}
            className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-[0_18px_40px_-18px_rgba(0,0,0,0.35)]"
          >
            <Link
              href={`/productos/${product.id}`}
              className="relative block aspect-square overflow-hidden focus-visible:outline-none"
              aria-label={`Ver ${product.name}`}
            >
              <div
                className={cn(
                  'absolute inset-0 bg-gradient-to-br',
                  categoryAccent[product.category],
                )}
              />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={placeholderImage(product.category)}
                alt=""
                aria-hidden
                className="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </Link>

            <div className="flex flex-1 flex-col gap-1 p-4">
              <h3 className="line-clamp-2 text-sm font-semibold leading-tight text-card-foreground">
                {product.name}
              </h3>
              <p className="text-base font-bold tabular-nums text-foreground">
                {cop.format(product.price)}
              </p>
              <Link
                href={`/productos/${product.id}`}
                className="mt-3 inline-flex items-center justify-center gap-1.5 rounded-full border border-border bg-background px-4 py-2 text-xs font-semibold text-foreground transition hover:border-primary/40 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                Ver más
                <ArrowRight className="size-3.5" aria-hidden />
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
