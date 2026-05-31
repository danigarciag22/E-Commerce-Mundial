'use client'

import { createContext, useContext } from 'react'

// Auth identity resolved on the server (shop layout) and shared with client
// components (wishlist heart, auth modal) without per-component fetches. The
// layout re-renders after sign-in/out (revalidatePath), updating this value.
type AuthState = { userId: string | null; isAuthenticated: boolean }

const AuthContext = createContext<AuthState>({ userId: null, isAuthenticated: false })

export function AuthProvider({
  userId,
  children,
}: {
  userId: string | null
  children: React.ReactNode
}) {
  return (
    <AuthContext.Provider value={{ userId, isAuthenticated: !!userId }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
