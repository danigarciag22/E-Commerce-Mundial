import { CreditCard, Gift, Truck } from 'lucide-react'

const BADGES = [
  {
    icon: CreditCard,
    title: 'Pago seguro y encriptado',
    detail: 'Protegido con cifrado de extremo a extremo',
  },
  {
    icon: Gift,
    title: 'Devoluciones gratuitas (30 días)',
    detail: 'Cambios y devoluciones sin costo',
  },
  {
    icon: Truck,
    title: 'Envío rápido certificado',
    detail: 'Despacho en 24–48 h con seguimiento',
  },
]

export function TrustBadges() {
  return (
    <ul className="mt-4 grid gap-3 rounded-2xl border border-border bg-muted/30 p-4 sm:grid-cols-3">
      {BADGES.map(({ icon: Icon, title, detail }) => (
        <li key={title} className="flex items-start gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-full border border-border bg-background text-foreground">
            <Icon className="size-4" aria-hidden />
          </span>
          <span className="flex flex-col gap-0.5">
            <span className="text-sm font-medium leading-tight text-foreground">{title}</span>
            <span className="text-xs leading-snug text-muted-foreground">{detail}</span>
          </span>
        </li>
      ))}
    </ul>
  )
}
