import { notFound } from 'next/navigation'
import Link from 'next/link'
import { requirePermission } from '@/lib/auth/guards'
import { createClient } from '@/lib/supabase/server'
import { getOrderById } from '@/lib/orders/getOrderById'
import { OrderStatusForm } from '@/components/admin/OrderStatusForm'
import { statusLabel, statusColor } from '@/lib/orders/orderStatus'
import { cn } from '@/lib/utils'

const cop = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission('manage_orders')
  const { id } = await params
  const supabase = await createClient()
  const order = await getOrderById(supabase, id)
  if (!order) notFound()

  return (
    <div className="flex flex-col gap-6">
      <Link href="/admin/ordenes" className="text-sm text-muted-foreground hover:underline">← Órdenes</Link>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Orden {order.id.slice(0, 8)}</h1>
          <p className="text-sm text-muted-foreground">{new Date(order.created_at).toLocaleString('es-CO')} · {order.customer_email ?? 'sin correo'}</p>
        </div>
        <span className={cn('rounded-full px-3 py-1 text-sm font-medium', statusColor[order.status as keyof typeof statusColor] ?? 'bg-muted')}>{statusLabel(order.status)}</span>
      </div>

      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-muted-foreground">Cambiar estado</h2>
        <OrderStatusForm id={order.id} status={order.status} />
      </div>

      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-muted-foreground">Artículos</h2>
        <ul className="divide-y divide-border text-sm">
          {order.items.map((it, i) => (
            <li key={i} className="flex items-center justify-between py-2.5">
              <span>{it.name} <span className="text-muted-foreground">× {it.quantity}</span></span>
              <span className="tabular-nums">{cop.format(it.price * it.quantity)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex items-center justify-between border-t border-border pt-4 font-semibold">
          <span>Total</span>
          <span className="tabular-nums">{cop.format(order.total)}</span>
        </div>
      </div>
    </div>
  )
}
