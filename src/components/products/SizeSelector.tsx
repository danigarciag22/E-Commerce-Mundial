'use client'

import { useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

// Per-size availability is presentational for now (the products table tracks a
// single aggregate stock). Wire to real per-variant stock in a later phase.
type SizeOption = {
  label: string
  left: number
}

const SIZES: SizeOption[] = [
  { label: 'S', left: 12 },
  { label: 'M', left: 5 },
  { label: 'L', left: 9 },
  { label: 'XL', left: 14 },
]

const LOW_STOCK_THRESHOLD = 6

export function SizeSelector() {
  const [selected, setSelected] = useState('M')
  const current = SIZES.find((s) => s.label === selected)!
  const isLow = current.left <= LOW_STOCK_THRESHOLD

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">Talla</span>
        <button
          type="button"
          className="text-xs font-medium text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
        >
          Guía de tallas
        </button>
      </div>

      <div className="flex flex-wrap gap-2" role="group" aria-label="Seleccionar talla">
        {SIZES.map((size) => {
          const isActive = size.label === selected
          return (
            <button
              key={size.label}
              type="button"
              onClick={() => setSelected(size.label)}
              aria-pressed={isActive}
              className={cn(
                'inline-flex h-11 min-w-12 items-center justify-center rounded-xl border px-4 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                isActive
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-background text-foreground hover:border-primary/40 hover:bg-muted',
              )}
            >
              {size.label}
            </button>
          )
        })}
      </div>

      {isLow && (
        <p
          className="inline-flex items-center gap-1.5 text-sm font-medium text-amber-600 dark:text-amber-500"
          aria-live="polite"
        >
          <AlertTriangle className="size-4 shrink-0" aria-hidden />
          ¡Quedan solo {current.left} unidades en esta talla (Talla {current.label})!
        </p>
      )}
    </div>
  )
}
