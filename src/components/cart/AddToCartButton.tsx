'use client'

import { useEffect, useRef, useState } from 'react'
import { Check, ShoppingBag } from 'lucide-react'
import { useCartStore } from '@/lib/cart/cartStore'
import type { ProductCategory } from '@/lib/products/types'
import { cn } from '@/lib/utils'

type Props = {
  id: string
  name: string
  price: number
  category: ProductCategory
  className?: string
}

export function AddToCartButton({ id, name, price, category, className }: Props) {
  const addItem = useCartStore((s) => s.addItem)
  const [added, setAdded] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [])

  function handleClick() {
    addItem({ id, name, price, category })
    setAdded(true)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => setAdded(false), 1500)
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        'inline-flex h-12 items-center justify-center gap-2 rounded-full bg-primary px-8 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        className,
      )}
    >
      <span aria-live="polite" className="inline-flex items-center gap-2">
        {added ? (
          <>
            <Check className="size-4" aria-hidden />
            Agregado
          </>
        ) : (
          <>
            <ShoppingBag className="size-4" aria-hidden />
            Agregar al carrito
          </>
        )}
      </span>
    </button>
  )
}
