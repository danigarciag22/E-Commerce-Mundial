import { SiteHeader } from '@/components/storefront/SiteHeader'
import { SiteFooter } from '@/components/storefront/SiteFooter'
import { CartPromoPopup } from '@/components/cart/CartPromoPopup'

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <div className="flex-1">{children}</div>
      <SiteFooter />
      <CartPromoPopup />
    </div>
  )
}
