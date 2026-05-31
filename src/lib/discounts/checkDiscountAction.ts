'use server'

import { createClient } from '@/lib/supabase/server'
import { validateDiscountCode } from './validateDiscountCode'

export type CheckDiscountState = { ok: true; code: string; percent: number } | { ok: false; error: string } | null

export async function checkDiscountAction(_prev: CheckDiscountState, formData: FormData): Promise<CheckDiscountState> {
  const code = String(formData.get('code') ?? '')
  const supabase = await createClient()
  const result = await validateDiscountCode(supabase, code)
  if (!result) return { ok: false, error: 'Código inválido o expirado' }
  return { ok: true, code: result.code, percent: result.percent }
}
