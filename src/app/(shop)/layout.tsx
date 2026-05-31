import { SiteHeader } from '@/components/storefront/SiteHeader'
import { SiteFooter } from '@/components/storefront/SiteFooter'
import { CartPromoPopup } from '@/components/cart/CartPromoPopup'
import { CartOwnerSync } from '@/components/cart/CartOwnerSync'
import { AuthProvider } from '@/components/auth/AuthContext'
import { AuthModalHost } from '@/components/auth/AuthModalHost'
import { getUser } from '@/lib/auth/getUser'

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser()
  const userId = user?.id ?? null

  return (
    <AuthProvider userId={userId}>
      <div className="flex min-h-screen flex-col">
        <SiteHeader user={user} />
        <div className="flex-1">{children}</div>
        <SiteFooter />
        <CartPromoPopup />
        <CartOwnerSync userId={userId} />
        <AuthModalHost />
      </div>
    </AuthProvider>
  )
}
