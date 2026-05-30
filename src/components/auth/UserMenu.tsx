import Link from 'next/link'
import { getUser } from '@/lib/auth/getUser'
import { signOut } from '@/lib/auth/actions'
import { isAdmin } from '@/lib/auth/roles'

export async function UserMenu() {
  const user = await getUser()

  if (!user) {
    return (
      <Link
        href="/login"
        className="rounded-md text-sm font-medium transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        Iniciar sesión
      </Link>
    )
  }

  return (
    <div className="flex items-center gap-3">
      {isAdmin(user.profile) && (
        <Link
          href="/admin"
          className="rounded-md text-sm font-medium transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          Admin
        </Link>
      )}
      <span className="hidden max-w-[14ch] truncate text-sm text-muted-foreground sm:inline">
        {user.email}
      </span>
      <form action={signOut}>
        <button
          type="submit"
          className="rounded-md text-sm font-medium transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          Salir
        </button>
      </form>
    </div>
  )
}
