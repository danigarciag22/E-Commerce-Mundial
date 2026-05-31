import { create } from 'zustand'

// Global open-state for the auth modal so any component (e.g. the wishlist
// heart on a product card) can prompt sign-in without prop drilling.
type AuthModalState = {
  open: boolean
  next: string
  openModal: (next?: string) => void
  setOpen: (open: boolean) => void
}

export const useAuthModalStore = create<AuthModalState>((set) => ({
  open: false,
  next: '/',
  openModal: (next = '/') => set({ open: true, next }),
  setOpen: (open) => set({ open }),
}))
