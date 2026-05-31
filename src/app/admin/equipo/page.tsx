import { requirePermission } from '@/lib/auth/guards'
import { createClient } from '@/lib/supabase/server'
import { getTeam } from '@/lib/team/getTeam'
import { updateMemberRoleAction } from '@/lib/team/teamActions'
import { ROLE_LABELS, TEAM_ROLES, type UserRole } from '@/lib/auth/roles'
import { Avatar } from '@/components/admin/Avatar'

const ASSIGNABLE: UserRole[] = [...TEAM_ROLES, 'customer']

export default async function TeamPage() {
  const me = await requirePermission('manage_team')
  const supabase = await createClient()
  const members = await getTeam(supabase)
  const team = members.filter((m) => m.role !== 'customer')

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Equipo</h1>
        <p className="text-sm text-muted-foreground">Gestiona los roles de tu equipo.</p>
      </div>
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/40">
            <tr>
              <th className="px-3 py-2 text-left font-medium text-muted-foreground">Miembro</th>
              <th className="px-3 py-2 text-left font-medium text-muted-foreground">Rol</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {team.map((m) => (
              <tr key={m.id} className="border-b border-border last:border-0">
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-2.5">
                    <Avatar name={m.name} email={m.email} src={m.avatarUrl} size={32} />
                    <div className="flex flex-col">
                      <span className="font-medium">{m.name ?? m.email}{m.id === me.id && <span className="ml-2 text-xs text-muted-foreground">(tú)</span>}</span>
                      {m.name && <span className="text-xs text-muted-foreground">{m.email}</span>}
                    </div>
                  </div>
                </td>
                <td className="px-3 py-2.5">{ROLE_LABELS[m.role]}</td>
                <td className="px-3 py-2.5">
                  <form action={updateMemberRoleAction} className="flex items-center gap-2">
                    <input type="hidden" name="id" value={m.id} />
                    <select name="role" defaultValue={m.role} className="rounded-lg border border-border bg-background px-2 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                      {ASSIGNABLE.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                    </select>
                    <button type="submit" className="rounded-md border border-border px-2 py-1 text-xs font-medium hover:bg-muted">Guardar</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted-foreground">
        Para sumar trabajadores: que se registren en la tienda, luego cámbiales el rol aquí.
        (Invitación directa por correo llegará cuando se configure la clave service-role.)
      </p>
    </div>
  )
}
