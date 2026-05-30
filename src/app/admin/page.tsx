import { createClient } from '@/lib/supabase/server'
import { getDashboardData } from '@/lib/metrics/getDashboardData'
import { RangeSelector } from '@/components/admin/RangeSelector'
import { SalesLineChart } from '@/components/admin/charts/SalesLineChart'
import { TopProductsBarChart } from '@/components/admin/charts/TopProductsBarChart'
import { StatusDonut } from '@/components/admin/charts/StatusDonut'

const cop = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1.5 text-2xl font-bold tabular-nums tracking-tight">{value}</p>
    </div>
  )
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <h2 className="mb-4 text-sm font-semibold text-muted-foreground">{title}</h2>
      {children}
    </div>
  )
}

const statusLabel: Record<string, string> = {
  paid: 'Pagado',
  pending: 'Pendiente',
  shipped: 'Enviado',
  cancelled: 'Cancelado',
}

export default async function AdminDashboard({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>
}) {
  const { range } = await searchParams
  const days = [7, 30, 90].includes(Number(range)) ? Number(range) : 90

  const supabase = await createClient()
  const data = await getDashboardData(supabase, days)

  const recent = await supabase
    .from('orders')
    .select('id, customer_email, total, status, created_at')
    .order('created_at', { ascending: false })
    .limit(5)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <RangeSelector />
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi label="Ingresos (pagado)" value={cop.format(data.revenue)} />
        <Kpi label="Órdenes pagadas" value={String(data.paidOrders)} />
        <Kpi label="Ticket promedio" value={cop.format(data.avgTicket)} />
        <Kpi label="Clientes" value={String(data.customers)} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Panel title={`Ventas (${days} días)`}>
            <SalesLineChart data={data.salesByDay} />
          </Panel>
        </div>
        <Panel title="Órdenes por estado">
          <StatusDonut data={data.byStatus} />
        </Panel>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Panel title="Top productos">
          <TopProductsBarChart data={data.topProducts} />
        </Panel>
        <Panel title="Órdenes recientes">
          <ul className="divide-y divide-border text-sm">
            {(recent.data ?? []).map((o) => (
              <li key={o.id} className="flex items-center justify-between py-2.5">
                <span className="truncate text-muted-foreground">{o.customer_email ?? '—'}</span>
                <span className="mx-3 shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs">
                  {statusLabel[o.status] ?? o.status}
                </span>
                <span className="shrink-0 font-medium tabular-nums">{cop.format(Number(o.total))}</span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  )
}
