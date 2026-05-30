'use client'

import { updateOrderStatusAction } from '@/lib/orders/orderActions'
import { ORDER_STATUSES } from '@/lib/orders/types'
import { statusLabel } from '@/lib/orders/orderStatus'

export function OrderStatusForm({ id, status }: { id: string; status: string }) {
  return (
    <form action={updateOrderStatusAction} className="flex items-center gap-2">
      <input type="hidden" name="id" value={id} />
      <select name="status" defaultValue={status} className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        {ORDER_STATUSES.map((s) => <option key={s} value={s}>{statusLabel(s)}</option>)}
      </select>
      <button type="submit" className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90">Actualizar</button>
    </form>
  )
}
