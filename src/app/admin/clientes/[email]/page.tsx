import Link from 'next/link'
import { requirePermission } from '@/lib/auth/guards'
import { createClient } from '@/lib/supabase/server'
import { getCustomerOrders } from '@/lib/customers/getCustomers'
import { statusLabel, statusColor } from '@/lib/orders/orderStatus'
import { cn } from '@/lib/utils'

const cop = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })

export default async function CustomerDetailPage({ params }: { params: Promise<{ email: string }> }) {
  await requirePermission('manage_orders')
  const { email: raw } = await params
  const email = decodeURIComponent(raw)
  const supabase = await createClient()
  const orders = await getCustomerOrders(supabase, email)

  const paid = orders.filter((o) => o.status === 'paid')
  const spent = paid.reduce((n, o) => n + o.total, 0)

  return (
    <div className="flex flex-col gap-6">
      <Link href="/admin/clientes" className="text-sm text-muted-foreground hover:underline">← Clientes</Link>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{email}</h1>
        <p className="text-sm text-muted-foreground">{orders.length} órdenes · {cop.format(spent)} gastado (pagado)</p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/40">
            <tr>
              <th className="px-3 py-2 text-left font-medium text-muted-foreground">Orden</th>
              <th className="px-3 py-2 text-left font-medium text-muted-foreground">Estado</th>
              <th className="px-3 py-2 text-left font-medium text-muted-foreground">Total</th>
              <th className="px-3 py-2 text-left font-medium text-muted-foreground">Fecha</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="border-b border-border last:border-0">
                <td className="px-3 py-2.5 font-mono text-xs text-muted-foreground">{o.id.slice(0, 8)}</td>
                <td className="px-3 py-2.5"><span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', statusColor[o.status as keyof typeof statusColor] ?? 'bg-muted')}>{statusLabel(o.status)}</span></td>
                <td className="px-3 py-2.5 tabular-nums">{cop.format(o.total)}</td>
                <td className="px-3 py-2.5 text-muted-foreground">{new Date(o.created_at).toLocaleDateString('es-CO')}</td>
                <td className="px-3 py-2.5"><Link href={`/admin/ordenes/${o.id}`} className="text-sm font-medium hover:underline">Ver orden</Link></td>
              </tr>
            ))}
            {orders.length === 0 && <tr><td colSpan={5} className="px-3 py-8 text-center text-muted-foreground">Sin órdenes.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
