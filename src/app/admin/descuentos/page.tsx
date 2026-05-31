import { requirePermission } from '@/lib/auth/guards'
import { createClient } from '@/lib/supabase/server'
import { getDiscounts } from '@/lib/discounts/getDiscounts'
import { DiscountForm } from '@/components/admin/DiscountForm'
import { DeleteButton } from '@/components/admin/DeleteButton'
import { toggleDiscountAction, deleteDiscountAction } from '@/lib/discounts/discountActions'
import { cn } from '@/lib/utils'

export default async function AdminDiscountsPage() {
  await requirePermission('manage_discounts')
  const supabase = await createClient()
  const discounts = await getDiscounts(supabase)
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold tracking-tight">Descuentos</h1>
      <DiscountForm />
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/40">
            <tr>
              <th className="px-3 py-2 text-left font-medium text-muted-foreground">Código</th>
              <th className="px-3 py-2 text-left font-medium text-muted-foreground">%</th>
              <th className="px-3 py-2 text-left font-medium text-muted-foreground">Estado</th>
              <th className="px-3 py-2 text-left font-medium text-muted-foreground">Expira</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {discounts.map((d) => (
              <tr key={d.id} className="border-b border-border last:border-0">
                <td className="px-3 py-2.5 font-mono font-medium">{d.code}</td>
                <td className="px-3 py-2.5 tabular-nums">{d.percent}%</td>
                <td className="px-3 py-2.5">
                  <form action={toggleDiscountAction}>
                    <input type="hidden" name="id" value={d.id} />
                    <input type="hidden" name="active" value={(!d.active).toString()} />
                    <button type="submit" className={cn('rounded-full px-2 py-0.5 text-xs font-medium', d.active ? 'bg-green-100 text-green-800' : 'bg-muted text-muted-foreground')}>
                      {d.active ? 'Activo' : 'Inactivo'}
                    </button>
                  </form>
                </td>
                <td className="px-3 py-2.5 text-muted-foreground">{d.expires_at ? new Date(d.expires_at).toLocaleDateString('es-CO') : 'Sin vencimiento'}</td>
                <td className="px-3 py-2.5"><DeleteButton action={deleteDiscountAction} id={d.id} confirmText={`¿Eliminar el código ${d.code}?`} /></td>
              </tr>
            ))}
            {discounts.length === 0 && <tr><td colSpan={5} className="px-3 py-8 text-center text-muted-foreground">Sin descuentos.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
