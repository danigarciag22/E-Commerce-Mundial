import { describe, it, expect } from 'vitest'
import { can } from '@/lib/auth/permissions'

describe('can', () => {
  it('admin has every permission incl manage_team', () => {
    expect(can('admin', 'manage_team')).toBe(true)
    expect(can('admin', 'manage_products')).toBe(true)
  })
  it('manager manages catalog/orders but not team', () => {
    expect(can('manager', 'manage_products')).toBe(true)
    expect(can('manager', 'manage_orders')).toBe(true)
    expect(can('manager', 'manage_team')).toBe(false)
  })
  it('staff only inventory + orders + dashboard', () => {
    expect(can('staff', 'manage_inventory')).toBe(true)
    expect(can('staff', 'manage_orders')).toBe(true)
    expect(can('staff', 'view_dashboard')).toBe(true)
    expect(can('staff', 'manage_products')).toBe(false)
  })
  it('viewer only dashboard', () => {
    expect(can('viewer', 'view_dashboard')).toBe(true)
    expect(can('viewer', 'manage_orders')).toBe(false)
  })
  it('customer has nothing', () => {
    expect(can('customer', 'view_dashboard')).toBe(false)
  })
})
