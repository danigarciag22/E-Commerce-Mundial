'use client'

import { useActionState } from 'react'
import { createDiscountAction, type DiscountFormState } from '@/lib/discounts/discountActions'

export function DiscountForm() {
  const [state, formAction, pending] = useActionState<DiscountFormState, FormData>(createDiscountAction, null)
  const field = 'rounded-lg border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-card p-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="code" className="text-xs font-medium text-muted-foreground">Código</label>
        <input id="code" name="code" className={field} placeholder="MUNDIAL10" />
        {state?.errors?.code && <span className="text-xs text-destructive">{state.errors.code}</span>}
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="percent" className="text-xs font-medium text-muted-foreground">% Descuento</label>
        <input id="percent" name="percent" type="number" min="1" max="100" className={field} />
        {state?.errors?.percent && <span className="text-xs text-destructive">{state.errors.percent}</span>}
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="expires_at" className="text-xs font-medium text-muted-foreground">Expira (opcional)</label>
        <input id="expires_at" name="expires_at" type="date" className={field} />
      </div>
      <button type="submit" disabled={pending} className="h-[38px] rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50">
        {pending ? 'Creando…' : 'Crear'}
      </button>
      {state?.error && <span className="w-full text-xs text-destructive">{state.error}</span>}
    </form>
  )
}
