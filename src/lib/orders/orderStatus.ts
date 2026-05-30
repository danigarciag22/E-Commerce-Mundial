import { ORDER_STATUSES, type OrderStatus } from './types'

export function isValidStatus(s: string): s is OrderStatus {
  return (ORDER_STATUSES as readonly string[]).includes(s)
}

const labels: Record<OrderStatus, string> = {
  pending: 'Pendiente', paid: 'Pagado', shipped: 'Enviado', cancelled: 'Cancelado',
}
export function statusLabel(s: string): string {
  return isValidStatus(s) ? labels[s] : s
}

export const statusColor: Record<OrderStatus, string> = {
  pending: 'bg-amber-100 text-amber-800',
  paid: 'bg-green-100 text-green-800',
  shipped: 'bg-blue-100 text-blue-800',
  cancelled: 'bg-destructive/10 text-destructive',
}
