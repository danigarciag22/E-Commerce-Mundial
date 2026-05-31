'use client'

import { useState } from 'react'
import { Rotate3d, ZoomIn } from 'lucide-react'
import type { ProductCategory } from '@/lib/products/types'
import { placeholderImage } from '@/lib/products/placeholderImage'
import { cn } from '@/lib/utils'

type Props = {
  category: ProductCategory
  name: string
  badge: string
}

// Distinct framings reuse the single category placeholder until real studio /
// lifestyle / detail photography lands in Fase 2 (see docs/3D-ASSETS.md).
// Each view tweaks gradient + crop so the gallery reads as 5 unique shots.
type View = {
  id: string
  kind: 'studio' | 'lifestyle' | 'detail'
  label: string
  frame: string
  objectClass: string
}

const VIEWS: View[] = [
  {
    id: 'studio',
    kind: 'studio',
    label: 'Estudio',
    frame: 'from-muted via-card to-muted/40',
    objectClass: 'object-cover',
  },
  {
    id: 'lifestyle-1',
    kind: 'lifestyle',
    label: 'En uso',
    frame: 'from-muted/70 via-card to-muted/20',
    objectClass: 'object-cover scale-110',
  },
  {
    id: 'lifestyle-2',
    kind: 'lifestyle',
    label: 'En cancha',
    frame: 'from-card via-muted/40 to-muted/60',
    objectClass: 'object-cover scale-105 -translate-x-2',
  },
  {
    id: 'detail-1',
    kind: 'detail',
    label: 'Escudo AFA',
    frame: 'from-muted via-muted/30 to-card',
    objectClass: 'object-cover scale-[1.8]',
  },
  {
    id: 'detail-2',
    kind: 'detail',
    label: 'Tela aireada',
    frame: 'from-muted/50 via-card to-muted/40',
    objectClass: 'object-cover scale-[2.2] translate-y-3',
  },
]

export function ProductGallery({ category, name, badge }: Props) {
  const [active, setActive] = useState(0)
  const view = VIEWS[active]
  const src = placeholderImage(category)

  return (
    <div className="flex flex-col gap-3">
      <div className="group relative aspect-square overflow-hidden rounded-2xl border border-border">
        <div className={cn('absolute inset-0 bg-gradient-to-br', view.frame)} />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={view.id}
          src={src}
          alt={`${name} — vista ${view.label.toLowerCase()}`}
          className={cn(
            'absolute inset-0 size-full transition-transform duration-500 ease-out',
            view.objectClass,
          )}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.06] [background-image:repeating-linear-gradient(45deg,currentColor_0_1px,transparent_1px_16px)]"
        />

        <span className="absolute left-4 top-4 rounded-full bg-primary px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary-foreground shadow-sm">
          {badge}
        </span>

        <span className="absolute right-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-background/75 px-3 py-1 text-xs font-medium text-foreground shadow-sm backdrop-blur">
          <Rotate3d className="size-3.5" aria-hidden />
          Vista 360°
        </span>

        <span className="pointer-events-none absolute bottom-4 right-4 inline-flex items-center gap-1.5 rounded-full bg-background/70 px-2.5 py-1 text-[0.7rem] font-medium text-muted-foreground opacity-0 backdrop-blur transition-opacity duration-300 group-hover:opacity-100">
          <ZoomIn className="size-3.5" aria-hidden />
          Pasa el cursor para ampliar
        </span>
      </div>

      <ul className="grid grid-cols-5 gap-2.5">
        {VIEWS.map((v, i) => (
          <li key={v.id}>
            <button
              type="button"
              onClick={() => setActive(i)}
              aria-pressed={i === active}
              aria-label={`Ver ${v.label}`}
              className={cn(
                'group/thumb relative block aspect-square w-full overflow-hidden rounded-xl border bg-gradient-to-br transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                v.frame,
                i === active
                  ? 'border-primary ring-1 ring-primary'
                  : 'border-border hover:border-primary/40',
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt=""
                aria-hidden
                className={cn('absolute inset-0 size-full', v.objectClass)}
              />
              <span className="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-background/85 to-transparent px-1.5 pb-1 pt-3 text-[0.6rem] font-medium leading-none text-foreground">
                {v.label}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
