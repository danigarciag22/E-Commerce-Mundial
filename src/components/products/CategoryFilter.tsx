'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { PRODUCT_CATEGORIES } from '@/lib/products/types'
import { cn } from '@/lib/utils'

const labels: Record<string, string> = {
  uniforme: 'Uniformes',
  zapato: 'Botines',
  balon: 'Balones',
  merchandising: 'Merch',
}

const pill =
  'inline-flex items-center rounded-full border px-4 py-2 text-sm font-medium transition-colors ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ' +
  'focus-visible:ring-offset-background'

const activePill = 'border-primary bg-primary text-primary-foreground shadow-sm'
const idlePill = 'border-border bg-card text-foreground hover:border-primary/40 hover:bg-muted'

export function CategoryFilter() {
  const pathname = usePathname()
  const params = useSearchParams()
  const active = params.get('category')

  function hrefFor(category: string | null) {
    const next = new URLSearchParams(params.toString())
    if (category) next.set('category', category)
    else next.delete('category')
    const qs = next.toString()
    return qs ? `${pathname}?${qs}` : pathname
  }

  return (
    <nav className="flex flex-wrap gap-2" aria-label="Filtrar por categoría">
      <Link
        href={hrefFor(null)}
        aria-current={!active ? 'page' : undefined}
        className={cn(pill, !active ? activePill : idlePill)}
      >
        Todos
      </Link>
      {PRODUCT_CATEGORIES.map((category) => (
        <Link
          key={category}
          href={hrefFor(category)}
          aria-current={active === category ? 'page' : undefined}
          className={cn(pill, active === category ? activePill : idlePill)}
        >
          {labels[category]}
        </Link>
      ))}
    </nav>
  )
}
