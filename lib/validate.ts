// Chhote server-side validators (koi extra package nahi chahiye)

export function str(v: FormDataEntryValue | null, max = 5000): string {
  return typeof v === 'string' ? v.trim().slice(0, max) : ''
}

export function isEmail(v: string): boolean {
  return v.length <= 200 && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)
}

export function isPhone(v: string): boolean {
  return /^[0-9+()\-\s]{6,20}$/.test(v)
}

// Sirf http/https allow (javascript: jaise links block)
export function safeUrl(v: string): string | null {
  if (!v) return null
  try {
    const u = new URL(/^https?:\/\//i.test(v) ? v : `https://${v}`)
    return u.protocol === 'http:' || u.protocol === 'https:' ? u.toString().slice(0, 300) : null
  } catch {
    return null
  }
}

export function intOrNull(v: string, min: number, max: number): number | null {
  if (!v) return null
  const n = Number.parseInt(v, 10)
  if (Number.isNaN(n)) return null
  return Math.max(min, Math.min(max, n))
}

export const JOB_TYPES = ['Full-time', 'Part-time', 'Contract', 'Internship', 'Freelance'] as const
export const CATEGORIES = [
  'Engineering',
  'Design',
  'Marketing',
  'Sales',
  'Support',
  'Finance',
  'Operations',
  'Education',
  'Healthcare',
  'Hospitality',
  'Retail',
  'Logistics',
  'Other',
] as const

export function friendlyDbError(message: string | undefined, fallback: string): string {
  if (message?.includes('rate_limit')) return 'Too many requests. Please wait a bit and try again.'
  return fallback
}

export function decimalOrNull(v: string, min: number, max: number): number | null {
  if (!v) return null
  const n = Number.parseFloat(v)
  if (Number.isNaN(n)) return null
  return Math.round(Math.max(min, Math.min(max, n)) * 100) / 100
}

export const GENDERS = ['male', 'female', 'other', 'prefer_not'] as const
