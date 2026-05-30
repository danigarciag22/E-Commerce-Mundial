'use client'

import { updateStockAction } from '@/lib/products/productActions'

export function StockEditor({ id, stock }: { id: string; stock: number }) {
  return (
    <form action={updateStockAction} className="flex items-center gap-2">
      <input type="hidden" name="id" value={id} />
      <input
        name="stock"
        type="number"
        min="0"
        defaultValue={stock}
        aria-label="Stock"
        className="w-20 rounded-md border border-border bg-background px-2 py-1 text-sm tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
      <button
        type="submit"
        className="rounded-md border border-border px-2 py-1 text-xs font-medium hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        Guardar
      </button>
    </form>
  )
}
