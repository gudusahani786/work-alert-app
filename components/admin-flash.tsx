// Green / red message shown after an admin action (?ok=... or ?error=...)
export function AdminFlash({ ok, error }: { ok?: string; error?: string }) {
  if (error) return <p className="mb-4 rounded-md bg-red-500/10 p-3 text-sm text-red-600">{error}</p>
  if (ok) return <p className="mb-4 rounded-md bg-green-500/10 p-3 text-sm text-green-700 dark:text-green-400">{ok}</p>
  return null
}

export function pick(v: string | string[] | undefined, max = 200): string {
  return typeof v === 'string' ? v.slice(0, max) : ''
}
