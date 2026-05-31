import { useSyncExternalStore } from 'react'

// Returns false during SSR and the first client render, then true once
// hydrated — without calling setState inside an effect. Use to gate UI that
// depends on client-only state (e.g. localStorage-persisted cart) so server
// and client markup match on first paint.
const emptySubscribe = () => () => {}

export function useHydrated(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  )
}
