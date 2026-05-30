import { createAdminClient } from '@/lib/supabase/admin'
import { getMetrics } from '@/lib/metrics/getMetrics'

const cop = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
})

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-3xl font-bold tabular-nums tracking-tight">{value}</p>
    </div>
  )
}

export default async function AdminMetricsPage() {
  const supabase = createAdminClient()
  const metrics = await getMetrics(supabase)
  return (
    <main>
      <h1 className="mb-6 text-2xl font-bold tracking-tight sm:text-3xl">Métricas</h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Stat label="Ingresos (pagado)" value={cop.format(metrics.revenue)} />
        <Stat label="Órdenes pagadas" value={String(metrics.paidOrders)} />
        <Stat label="Productos" value={String(metrics.totalProducts)} />
      </div>
    </main>
  )
}
