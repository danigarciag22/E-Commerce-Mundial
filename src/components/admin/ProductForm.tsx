'use client'

import { useActionState } from 'react'
import { PRODUCT_CATEGORIES } from '@/lib/products/types'
import type { ProductFormState } from '@/lib/products/productActions'

type Action = (prev: ProductFormState, formData: FormData) => Promise<ProductFormState>

type Defaults = {
  name?: string
  sku?: string
  price?: number | string
  category?: string
  description?: string | null
}

const labels: Record<string, string> = {
  uniforme: 'Uniforme',
  zapato: 'Botines',
  balon: 'Balón',
  merchandising: 'Merch',
}

const field =
  'rounded-lg border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'

export function ProductForm({
  action,
  defaults,
  submitLabel,
}: {
  action: Action
  defaults?: Defaults
  submitLabel: string
}) {
  const [state, formAction, pending] = useActionState<ProductFormState, FormData>(action, null)
  const d = defaults ?? {}

  return (
    <form action={formAction} className="flex max-w-lg flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="name" className="text-sm font-medium">
          Nombre
        </label>
        <input id="name" name="name" defaultValue={d.name} className={field} />
        {state?.errors?.name && (
          <p role="alert" className="text-sm text-destructive">
            {state.errors.name}
          </p>
        )}
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="sku" className="text-sm font-medium">
          SKU
        </label>
        <input id="sku" name="sku" defaultValue={d.sku} className={field} />
        {state?.errors?.sku && (
          <p role="alert" className="text-sm text-destructive">
            {state.errors.sku}
          </p>
        )}
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="price" className="text-sm font-medium">
          Precio (COP)
        </label>
        <input id="price" name="price" type="number" min="0" defaultValue={d.price} className={field} />
        {state?.errors?.price && (
          <p role="alert" className="text-sm text-destructive">
            {state.errors.price}
          </p>
        )}
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="category" className="text-sm font-medium">
          Categoría
        </label>
        <select
          id="category"
          name="category"
          defaultValue={d.category ?? 'uniforme'}
          className={field}
        >
          {PRODUCT_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {labels[c]}
            </option>
          ))}
        </select>
        {state?.errors?.category && (
          <p role="alert" className="text-sm text-destructive">
            {state.errors.category}
          </p>
        )}
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="description" className="text-sm font-medium">
          Descripción
        </label>
        <textarea
          id="description"
          name="description"
          defaultValue={d.description ?? ''}
          rows={3}
          className={field}
        />
      </div>
      {state?.error && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="h-11 rounded-full bg-primary text-sm font-semibold text-primary-foreground transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
      >
        {pending ? 'Guardando…' : submitLabel}
      </button>
    </form>
  )
}
