export type DiscountInput = { code: string; percent: number; expires_at: string | null }

type Raw = { code?: string; percent?: string; expires_at?: string }

export type DiscountResult =
  | { ok: true; data: DiscountInput }
  | { ok: false; errors: Partial<Record<keyof Raw, string>> }

export function validateDiscount(raw: Raw): DiscountResult {
  const errors: Partial<Record<keyof Raw, string>> = {}
  const code = (raw.code ?? '').trim().toUpperCase()
  if (!code) errors.code = 'Código obligatorio'
  const percent = Number(raw.percent)
  if (!Number.isInteger(percent) || percent < 1 || percent > 100) {
    errors.percent = 'El porcentaje debe estar entre 1 y 100'
  }
  if (Object.keys(errors).length > 0) return { ok: false, errors }
  const exp = (raw.expires_at ?? '').trim()
  return { ok: true, data: { code, percent, expires_at: exp === '' ? null : exp } }
}
