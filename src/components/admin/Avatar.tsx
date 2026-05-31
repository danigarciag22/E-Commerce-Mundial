import { initials } from '@/lib/profile/initials'
import { cn } from '@/lib/utils'

export function Avatar({ name, email, src, size = 36, className }: {
  name: string | null; email: string; src?: string | null; size?: number; className?: string
}) {
  const dim = { width: size, height: size }
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={name ?? email} style={dim} className={cn('rounded-full object-cover', className)} />
  }
  return (
    <span style={dim} className={cn('grid place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary', className)}>
      {initials(name, email)}
    </span>
  )
}
