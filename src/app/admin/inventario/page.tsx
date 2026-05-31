import { requirePermission } from '@/lib/auth/guards'
import { createClient } from '@/lib/supabase/server'
import { getProducts } from '@/lib/products/getProducts'
import { StockEditor } from '@/components/admin/StockEditor'
import { cn } from '@/lib/utils'

function stockState(stock: number) {
  if (stock === 0) return { label: 'Agotado', cls: 'bg-destructive/10 text-destructive' }
  if (stock <= 5) return { label: 'Bajo', cls: 'bg-amber-100 text-amber-800' }
  return { label: 'OK', cls: 'bg-green-100 text-green-800' }
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1.5 text-2xl font-bold tabular-nums">{value}</p>
    </div>
  )
}

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ low?: string }>
}) {
  await requirePermission('manage_inventory')
  const { low } = await searchParams
  const onlyLow = low === '1'

  const supabase = await createClient()
  const all = await getProducts(supabase)
  const products = onlyLow ? all.filter((p) => p.stock <= 5) : all

  const totalSkus = all.length
  const outOfStock = all.filter((p) => p.stock === 0).length
  const lowStock = all.filter((p) => p.stock > 0 && p.stock <= 5).length

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold tracking-tight">Inventario</h1>
      <div className="grid grid-cols-3 gap-4">
        <Kpi label="SKUs" value={String(totalSkus)} />
        <Kpi label="Agotados" value={String(outOfStock)} />
        <Kpi label="Bajo stock" value={String(lowStock)} />
      </div>

      <div className="flex gap-2 text-sm">
        <a
          href="/admin/inventario"
          className={cn(
            'rounded-full border px-3 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            !onlyLow ? 'border-primary bg-primary text-primary-foreground' : 'border-border',
          )}
        >
          Todos
        </a>
        <a
          href="/admin/inventario?low=1"
          className={cn(
            'rounded-full border px-3 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            onlyLow ? 'border-primary bg-primary text-primary-foreground' : 'border-border',
          )}
        >
          Solo bajo stock
        </a>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/40">
            <tr>
              <th className="px-3 py-2 text-left font-medium text-muted-foreground">Producto</th>
              <th className="px-3 py-2 text-left font-medium text-muted-foreground">SKU</th>
              <th className="px-3 py-2 text-left font-medium text-muted-foreground">Estado</th>
              <th className="px-3 py-2 text-left font-medium text-muted-foreground">Stock</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => {
              const st = stockState(p.stock)
              return (
                <tr key={p.id} className="border-b border-border last:border-0">
                  <td className="px-3 py-2.5 font-medium">{p.name}</td>
                  <td className="px-3 py-2.5 text-muted-foreground">{p.sku}</td>
                  <td className="px-3 py-2.5">
                    <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', st.cls)}>
                      {st.label}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    <StockEditor id={p.id} stock={p.stock} />
                  </td>
                </tr>
              )
            })}
            {products.length === 0 && (
              <tr>
                <td colSpan={4} className="px-3 py-8 text-center text-muted-foreground">
                  Sin productos.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
