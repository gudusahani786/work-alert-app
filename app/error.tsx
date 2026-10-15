'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useI18n } from '@/lib/i18n/client'

// Shown instead of the bare "This page couldn't load" screen when a page crashes.
export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const { t } = useI18n()

  useEffect(() => {
    console.error('Page error:', error)
  }, [error])

  return (
    <div className="flex min-h-dvh w-full flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-2xl font-bold">{t('err.title')}</h1>
      <p className="max-w-sm text-sm text-muted-foreground">{t('err.desc')}</p>
      {error.digest ? <p className="text-xs text-muted-foreground">ID: {error.digest}</p> : null}
      <div className="flex gap-2">
        <Button type="button" onClick={() => reset()}>
          {t('err.retry')}
        </Button>
        <Button asChild variant="outline">
          <Link href="/">{t('err.home')}</Link>
        </Button>
      </div>
    </div>
  )
}
