import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Tracks whether the welcome-offer popup has been resolved, so it only shows
// once per browser (until the user subscribes or dismisses it).
type NewsletterState = {
  status: 'idle' | 'subscribed' | 'dismissed'
  email: string | null
  subscribe: (email: string) => void
  dismiss: () => void
}

export const useNewsletterStore = create<NewsletterState>()(
  persist(
    (set) => ({
      status: 'idle',
      email: null,
      subscribe: (email) => set({ status: 'subscribed', email }),
      dismiss: () => set({ status: 'dismissed' }),
    }),
    { name: 'newsletter' },
  ),
)
