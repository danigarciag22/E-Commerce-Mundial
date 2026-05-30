import { createHmac, timingSafeEqual } from 'node:crypto'

type Input = { xSignature: string | null; xRequestId: string | null; dataId: string | null; secret: string }

export function verifyWebhookSignature({ xSignature, xRequestId, dataId, secret }: Input): boolean {
  if (!xSignature || !dataId) return false
  const parts = Object.fromEntries(
    xSignature.split(',').map((kv) => kv.split('=').map((s) => s.trim()) as [string, string]),
  )
  const ts = parts.ts
  const v1 = parts.v1
  if (!ts || !v1) return false
  const manifest = `id:${dataId};request-id:${xRequestId ?? ''};ts:${ts};`
  const expected = createHmac('sha256', secret).update(manifest).digest('hex')
  const a = Buffer.from(expected, 'hex')
  const b = Buffer.from(v1, 'hex')
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}
