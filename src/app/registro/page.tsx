import { redirect } from 'next/navigation'

// Sign-up now lives in the unified auth card. Keep the route as a deep link
// that opens the card on the "Registrarse" tab.
export default function RegistroPage() {
  redirect('/login?tab=signup')
}
