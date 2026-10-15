import { createClient } from '@/lib/supabase/server'

export type SiteSettings = {
  dev_name: string
  dev_title: string
  dev_about: string
  dev_photo_url: string
  support_email: string
  support_phone: string
  support_whatsapp: string
  announcement: string
}

const DEFAULTS: SiteSettings = {
  dev_name: 'GUDUTECH',
  dev_title: 'Developer',
  dev_about: '',
  dev_photo_url: '',
  support_email: '',
  support_phone: '',
  support_whatsapp: '',
  announcement: '',
}

// Reads the site settings the admin edits (developer profile, support contacts, announcement).
// Never throws: if the table is missing it returns the defaults.
export async function getSiteSettings(): Promise<SiteSettings> {
  const result: SiteSettings = { ...DEFAULTS }
  try {
    const supabase = await createClient()
    const { data } = await supabase.from('app_settings').select('key, value')
    for (const row of data ?? []) {
      if (row.key in result) (result as Record<string, string>)[row.key] = row.value ?? ''
    }
  } catch {
    /* use defaults */
  }
  return result
}

export function whatsappLink(v: string): string | null {
  const digits = v.replace(/\D/g, '')
  return digits.length >= 6 ? `https://wa.me/${digits}` : null
}
