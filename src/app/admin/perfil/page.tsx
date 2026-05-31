import { requireCrm } from '@/lib/auth/guards'
import { Avatar } from '@/components/admin/Avatar'
import { ProfileForm } from '@/components/admin/ProfileForm'
import { ROLE_LABELS } from '@/lib/auth/roles'

export default async function ProfilePage() {
  const user = await requireCrm()

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Perfil</h1>
        <p className="text-sm text-muted-foreground">Gestiona tu nombre y tu foto.</p>
      </div>

      <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-6 shadow-sm">
        <Avatar name={user.name} email={user.email} src={user.avatarUrl} size={80} />
        <div className="flex flex-col gap-1">
          <span className="text-lg font-semibold">{user.name ?? user.email}</span>
          <span className="text-sm text-muted-foreground">{user.email}</span>
          {user.profile && (
            <span className="mt-1 w-fit rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
              {ROLE_LABELS[user.profile.role]}
            </span>
          )}
        </div>
      </div>

      <ProfileForm defaultName={user.name} />
    </div>
  )
}
