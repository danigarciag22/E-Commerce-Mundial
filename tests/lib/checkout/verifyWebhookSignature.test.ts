import { describe, it, expect } from 'vitest'
import { createHmac } from 'node:crypto'
import { verifyWebhookSignature } from '@/lib/checkout/verifyWebhookSignature'

const secret = 'test-secret'
const dataId = '123456'
const requestId = 'req-abc'
const ts = '1700000000'

function sign(manifest: string) {
  return createHmac('sha256', secret).update(manifest).digest('hex')
}

describe('verifyWebhookSignature', () => {
  it('accepts a valid signature', () => {
    const v1 = sign(`id:${dataId};request-id:${requestId};ts:${ts};`)
    expect(verifyWebhookSignature({ xSignature: `ts=${ts},v1=${v1}`, xRequestId: requestId, dataId, secret })).toBe(true)
  })
  it('rejects a tampered signature', () => {
    expect(verifyWebhookSignature({ xSignature: `ts=${ts},v1=deadbeef`, xRequestId: requestId, dataId, secret })).toBe(false)
  })
  it('rejects a malformed header', () => {
    expect(verifyWebhookSignature({ xSignature: 'garbage', xRequestId: requestId, dataId, secret })).toBe(false)
  })
})
