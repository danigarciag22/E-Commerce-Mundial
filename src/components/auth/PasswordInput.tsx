'use client'

import { useState } from 'react'
import { Eye, EyeOff, Lock } from 'lucide-react'
import { cn } from '@/lib/utils'

// Password field with a show/hide eye toggle, shared by the auth card and the
// password-reset flow.
export function PasswordInput({
  id,
  name,
  autoComplete,
  placeholder,
  value,
  onChange,
}: {
  id: string
  name: string
  autoComplete: string
  placeholder: string
  value?: string
  onChange?: (v: string) => void
}) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative">
      <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
      <input
        id={id}
        name={name}
        type={show ? 'text' : 'password'}
        autoComplete={autoComplete}
        required
        placeholder={placeholder}
        value={value}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        className={cn(
          'h-11 w-full rounded-xl border border-border bg-background pl-10 pr-10 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        )}
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        aria-pressed={show}
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {show ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
      </button>
    </div>
  )
}
