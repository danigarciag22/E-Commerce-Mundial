import { requirePermission } from '@/lib/auth/guards'
import { createClient } from '@/lib/supabase/server'
import { getCustomers } from '@/lib/customers/getCustomers'
import { CustomersTable } from '@/components/admin/CustomersTable'

export default async function AdminCustomersPage() {
  await requirePermission('manage_orders')
  const supabase = await createClient()
  const customers = await getCustomers(supabase)
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold tracking-tight">Clientes</h1>
      <CustomersTable customers={customers} />
    </div>
  )
}
