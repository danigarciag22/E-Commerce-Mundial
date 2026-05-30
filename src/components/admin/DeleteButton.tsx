'use client'

type Action = (formData: FormData) => void | Promise<void>

export function DeleteButton({ action, id, label = 'Eliminar', confirmText }: { action: Action; id: string; label?: string; confirmText: string }) {
  return (
    <form action={action} onSubmit={(e) => { if (!confirm(confirmText)) e.preventDefault() }}>
      <input type="hidden" name="id" value={id} />
      <button type="submit" className="text-sm font-medium text-destructive hover:underline">{label}</button>
    </form>
  )
}
