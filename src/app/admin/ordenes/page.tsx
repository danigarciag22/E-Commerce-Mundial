import { requirePermission } from '@/lib/auth/guards'
import { createClient } from '@/lib/supabase/server'
import { getOrders } from '@/lib/orders/getOrders'
import { OrdersTable } from '@/components/admin/OrdersTable'

export default async function AdminOrdersPage() {
  await requirePermission('manage_orders')
  const supabase = await createClient()
  const orders = await getOrders(supabase)
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold tracking-tight">Órdenes</h1>
      <OrdersTable orders={orders} />
    </div>
  )
}
