export function initials(name: string | null, email: string): string {
  const source = (name ?? '').trim()
  if (source) {
    const parts = source.split(/\s+/).slice(0, 2)
    return parts.map((p) => p[0]?.toUpperCase() ?? '').join('')
  }
  return (email.trim()[0] ?? '?').toUpperCase()
}
