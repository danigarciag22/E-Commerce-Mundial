import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { getProductById } from '@/lib/products/getProductById'
import type { Product } from '@/lib/products/types'

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

// Next.js 16: params is async (a Promise) and must be awaited.
type ProductPageProps = {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const product = await getProductById(supabase, id)

  if (!product) {
    return { title: 'Producto no encontrado | Tienda Mundial 2026' }
  }

  const description =
    product.description ?? `${product.name} — disponible en la Tienda Mundial 2026.`

  return {
    title: `${product.name} | Tienda Mundial 2026`,
    description,
    openGraph: {
      title: `${product.name} | Tienda Mundial 2026`,
      description,
      type: 'website',
    },
  }
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params
  const supabase = await createClient()
  const product = await getProductById(supabase, id)

  if (!product) notFound()

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 rounded-md text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Volver al catálogo
      </Link>

      <article className="mt-6 grid gap-8 md:grid-cols-2">
        <div className="relative aspect-square overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-muted via-card to-muted/40">
          {/* Pitch-line motif — replaced by interactive 3D render in Fase 2 */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[0.06] [background-image:repeating-linear-gradient(45deg,currentColor_0_1px,transparent_1px_16px)]"
          />
          <span className="absolute left-4 top-4 rounded-full bg-primary px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary-foreground shadow-sm">
            {categoryLabel[product.category]}
          </span>
        </div>

        <div className="flex flex-col gap-4">
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {product.name}
          </h1>

          <p className="text-3xl font-bold tabular-nums text-foreground">
            {cop.format(product.price)}
          </p>

          {product.description && (
            <p className="text-base leading-relaxed text-muted-foreground">
              {product.description}
            </p>
          )}

          <dl className="mt-2 border-t border-border pt-4 text-sm">
            <div className="flex items-center gap-2">
              <dt className="font-medium text-foreground">SKU</dt>
              <dd className="font-mono text-muted-foreground">{product.sku}</dd>
            </div>
          </dl>
        </div>
      </article>
    </main>
  )
}
