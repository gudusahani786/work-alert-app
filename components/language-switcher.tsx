'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Globe } from 'lucide-react'
import { setLanguage } from '@/app/actions'
import { LOCALES, LOCALE_NAMES } from '@/lib/i18n/dictionaries'
import { useI18n } from '@/lib/i18n/client'

// Chhota dropdown (navbar / login page ke liye)
export function LanguageSwitcher() {
  const { locale, t } = useI18n()
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  return (
    <label className="relative inline-flex items-center" title={t('set.language')}>
      <Globe className="pointer-events-none absolute left-2 h-4 w-4 text-muted-foreground" />
      <select
        aria-label={t('set.language')}
        value={locale}
        disabled={pending}
        onChange={(e) =>
          startTransition(async () => {
            await setLanguage(e.target.value)
            router.refresh()
          })
        }
        className="h-8 cursor-pointer rounded-lg border border-border bg-background pl-7 pr-2 text-xs font-medium outline-none dark:[&>option]:bg-background"
      >
        {LOCALES.map((l) => (
          <option key={l} value={l}>
            {LOCALE_NAMES[l]}
          </option>
        ))}
      </select>
    </label>
  )
}

// Settings page ke liye bade buttons
export function LanguageCards() {
  const { locale } = useI18n()
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  return (
    <div className="grid gap-2 sm:grid-cols-3">
      {LOCALES.map((l) => (
        <button
          key={l}
          type="button"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              await setLanguage(l)
              router.refresh()
            })
          }
          className={`rounded-lg border px-3 py-3 text-sm font-medium transition-colors ${
            locale === l ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:bg-muted'
          }`}
        >
          {LOCALE_NAMES[l]}
        </button>
      ))}
    </div>
  )
}
