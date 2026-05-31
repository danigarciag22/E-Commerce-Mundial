// Shared password policy used by the sign-up UI (live checklist) and the
// server action (enforcement). Keep the two in sync by importing from here.
export type PasswordCheck = {
  id: 'length' | 'number' | 'uppercase'
  label: string
  ok: boolean
}

export function checkPassword(password: string): PasswordCheck[] {
  return [
    { id: 'length', label: 'Mínimo 8 caracteres', ok: password.length >= 8 },
    { id: 'number', label: 'Al menos un número', ok: /\d/.test(password) },
    { id: 'uppercase', label: 'Al menos una mayúscula', ok: /[A-Z]/.test(password) },
  ]
}

export function isPasswordValid(password: string): boolean {
  return checkPassword(password).every((c) => c.ok)
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function isEmailValid(email: string): boolean {
  return EMAIL_RE.test(email.trim())
}
