'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Boxes,
  Tag,
  FolderTree,
  UsersRound,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { can, type Permission } from '@/lib/auth/permissions'
import type { UserRole } from '@/lib/auth/roles'

type NavItem = {
  href: string
  label: string
  icon: typeof LayoutDashboard
  permission: Permission
  exact?: boolean
}

const items: NavItem[] = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, permission: 'view_dashboard', exact: true },
  { href: '/admin/productos', label: 'Productos', icon: Package, permission: 'manage_products' },
  { href: '/admin/ordenes', label: 'Órdenes', icon: ShoppingCart, permission: 'manage_orders' },
  { href: '/admin/clientes', label: 'Clientes', icon: Users, permission: 'manage_orders' },
  { href: '/admin/inventario', label: 'Inventario', icon: Boxes, permission: 'manage_inventory' },
  { href: '/admin/descuentos', label: 'Descuentos', icon: Tag, permission: 'manage_discounts' },
  { href: '/admin/colecciones', label: 'Colecciones', icon: FolderTree, permission: 'manage_collections' },
  { href: '/admin/equipo', label: 'Equipo', icon: UsersRound, permission: 'manage_team' },
]

export function AdminSidebar({ role }: { role: UserRole }) {
  const pathname = usePathname()
  const visible = items.filter((item) => can(role, item.permission))
  return (
    <aside className="hidden w-60 shrink-0 border-r border-border bg-card md:block">
      <div className="sticky top-0 flex h-screen flex-col">
        <Link
          href="/"
          className="flex h-14 items-center gap-2 border-b border-border px-5 font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className="grid size-7 place-items-center rounded-full bg-primary text-xs font-black text-primary-foreground">
            26
          </span>
          CRM
        </Link>
        <nav className="flex flex-1 flex-col gap-1 p-3">
          {visible.map(({ href, label, icon: Icon, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  active
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
              >
                <Icon className="size-4 shrink-0" />
                {label}
              </Link>
            )
          })}
        </nav>
        <Link
          href="/"
          className="border-t border-border px-5 py-3 text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          ← Ver tienda
        </Link>
      </div>
    </aside>
  )
}
