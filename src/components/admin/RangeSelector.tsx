'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'

const ranges = [
  { days: 7, label: '7 días' },
  { days: 30, label: '30 días' },
  { days: 90, label: '90 días' },
]

export function RangeSelector() {
  const pathname = usePathname()
  const params = useSearchParams()
  const current = params.get('range') ?? '90'

  return (
    <div className="flex gap-1 rounded-lg border border-border p-1">
      {ranges.map((r) => (
        <Link
          key={r.days}
          href={`${pathname}?range=${r.days}`}
          className={cn(
            'rounded-md px-3 py-1 text-sm font-medium transition-colors',
            current === String(r.days)
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:bg-muted',
          )}
        >
          {r.label}
        </Link>
      ))}
    </div>
  )
}
