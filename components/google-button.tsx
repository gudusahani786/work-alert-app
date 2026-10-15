'use client'

import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { useI18n } from '@/lib/i18n/client'

export function GoogleButton({ label }: { label?: string }) {
  const { t } = useI18n()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleGoogle = async () => {
    setLoading(true)
    setError(null)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/`,
        },
      })
      if (error) throw error
      // Browser Google page pe redirect ho jayega
    } catch (err) {
      console.error('Google sign-in error:', err)
      setError(t('auth.errGoogle'))
      setLoading(false)
    }
  }

  return (
    <div className="grid gap-2">
      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={handleGoogle}
        disabled={loading}
      >
        <svg className="mr-2 size-4" viewBox="0 0 24 24" aria-hidden="true">
          <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.3-1.6 3.8-5.5 3.8-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.4 14.6 2.4 12 2.4 6.7 2.4 2.4 6.7 2.4 12s4.3 9.6 9.6 9.6c5.5 0 9.2-3.9 9.2-9.4 0-.6-.1-1.1-.2-1.6H12z" />
        </svg>
        {loading ? t('auth.redirecting') : (label ?? t('auth.google'))}
      </Button>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  )
}

export function OrDivider() {
  const { t } = useI18n()
  return (
    <div className="relative my-1 flex items-center">
      <div className="flex-1 border-t" />
      <span className="mx-3 text-xs uppercase text-muted-foreground">{t('auth.or')}</span>
      <div className="flex-1 border-t" />
    </div>
  )
}
