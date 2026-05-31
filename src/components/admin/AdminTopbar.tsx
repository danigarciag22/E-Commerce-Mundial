import Link from 'next/link'
import { getUser } from '@/lib/auth/getUser'
import { signOut } from '@/lib/auth/actions'
import { Avatar } from '@/components/admin/Avatar'

export async function AdminTopbar() {
  const user = await getUser()
  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-background px-4 md:px-6">
      <span className="font-semibold md:hidden">CRM</span>
      <div className="ml-auto flex items-center gap-3">
        {user && (
          <Link
            href="/admin/perfil"
            className="flex items-center gap-2 rounded-full px-1 py-0.5 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Avatar name={user.name} email={user.email} src={user.avatarUrl} size={32} />
            <span className="hidden text-sm text-muted-foreground sm:inline">Perfil</span>
          </Link>
        )}
        <form action={signOut}>
          <button
            type="submit"
            className="rounded-md px-1 py-0.5 text-sm font-medium hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Salir
          </button>
        </form>
      </div>
    </header>
  )
}
