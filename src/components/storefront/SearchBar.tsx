'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useState } from 'react'
import { Search } from 'lucide-react'

function SearchForm({ initialQuery }: { initialQuery: string }) {
  const router = useRouter()
  const [q, setQ] = useState(initialQuery)

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const term = q.trim()
    if (term) router.push(`/buscar?q=${encodeURIComponent(term)}`)
  }

  return (
    <form onSubmit={submit} role="search" className="relative hidden flex-1 md:block">
      <Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Buscar productos…"
        aria-label="Buscar productos"
        className="w-full rounded-full border border-border bg-background py-2 pl-9 pr-4 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
    </form>
  )
}

function SearchFormWithParams() {
  const params = useSearchParams()
  return <SearchForm initialQuery={params.get('q') ?? ''} />
}

export function SearchBar() {
  return (
    <Suspense fallback={<SearchForm initialQuery="" />}>
      <SearchFormWithParams />
    </Suspense>
  )
}
