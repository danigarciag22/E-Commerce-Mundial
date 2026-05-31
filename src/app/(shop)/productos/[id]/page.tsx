import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { getProductById } from '@/lib/products/getProductById'
import { getProducts } from '@/lib/products/getProducts'
import { AddToCartButton } from '@/components/cart/AddToCartButton'
import { ProductGallery } from '@/components/products/ProductGallery'
import { SizeSelector } from '@/components/products/SizeSelector'
import { TrustBadges } from '@/components/products/TrustBadges'
import { ProductReviews } from '@/components/products/ProductReviews'
import { RelatedProducts } from '@/components/products/RelatedProducts'
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

const INSTALLMENTS = 3

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

  // "Completa el look": surface other catalog items as cross-sell suggestions.
  const related = (await getProducts(supabase))
    .filter((p) => p.id !== product.id)
    .slice(0, 3)

  const installment = Math.round(product.price / INSTALLMENTS)

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 rounded-md text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Volver al catálogo
      </Link>

      <article className="mt-6 grid gap-10 md:grid-cols-2">
        <ProductGallery
          category={product.category}
          name={product.name}
          badge={categoryLabel[product.category]}
        />

        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              {product.name}
            </h1>
          </div>

          <div className="flex flex-col gap-1">
            <p className="text-3xl font-bold tabular-nums text-foreground">
              {cop.format(product.price)}
            </p>
            <p className="text-sm text-muted-foreground">
              O {INSTALLMENTS} cuotas de{' '}
              <span className="font-semibold text-foreground tabular-nums">
                {cop.format(installment)}
              </span>{' '}
              sin interés.
            </p>
          </div>

          {product.description && (
            <p className="text-base leading-relaxed text-muted-foreground">
              {product.description}
            </p>
          )}

          <div className="mt-1 border-t border-border pt-5">
            <SizeSelector />
          </div>

          <AddToCartButton
            id={product.id}
            name={product.name}
            price={product.price}
            category={product.category}
            className="mt-1 w-full"
          />

          <TrustBadges />

          <dl className="mt-2 border-t border-border pt-4 text-sm">
            <div className="flex items-center gap-2">
              <dt className="font-medium text-foreground">SKU</dt>
              <dd className="font-mono text-muted-foreground">{product.sku}</dd>
            </div>
          </dl>
        </div>
      </article>

      <ProductReviews />

      <RelatedProducts products={related} />
    </main>
  )
}
