import { SiteHeader } from '@/components/storefront/SiteHeader'
import { SiteFooter } from '@/components/storefront/SiteFooter'
import { CartPromoPopup } from '@/components/cart/CartPromoPopup'
import { CartOwnerSync } from '@/components/cart/CartOwnerSync'
import { getUser } from '@/lib/auth/getUser'

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser()

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <div className="flex-1">{children}</div>
      <SiteFooter />
      <CartPromoPopup />
      <CartOwnerSync userId={user?.id ?? null} />
    </div>
  )
}
