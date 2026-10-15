'use client'

import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { GoogleButton, OrDivider } from '@/components/google-button'
import { EmailCodeForm } from '@/components/email-code-form'
import { LanguageSwitcher } from '@/components/language-switcher'
import { useI18n } from '@/lib/i18n/client'
import type { Key } from '@/lib/i18n/dictionaries'

function loginErrorKey(error: unknown): Key {
  const { code, status } = (error ?? {}) as { code?: string; status?: number }
  if (code === 'email_not_confirmed') return 'auth.errNotConfirmed'
  if (code === 'over_request_rate_limit' || status === 429) return 'auth.errRate'
  if (code === 'invalid_credentials') return 'auth.errInvalid'
  return 'auth.errGeneric'
}

export default function Page() {
  const { t } = useI18n()
  const [tab, setTab] = useState<'password' | 'code'>('password')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
      if (error) throw error
      router.push('/')
      router.refresh()
    } catch (error: unknown) {
      console.error('Login error:', error)
      setError(t(loginErrorKey(error)))
    } finally {
      setIsLoading(false)
    }
  }

  const tabClass = (active: boolean) =>
    `flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
      active ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'
    }`

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="absolute right-4 top-4">
        <LanguageSwitcher />
      </div>
      <div className="w-full max-w-sm">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">{t('auth.login')}</CardTitle>
            <CardDescription>{t('auth.loginDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-6">
              <GoogleButton />
              <OrDivider />

              <div className="flex gap-1 rounded-lg bg-muted p-1">
                <button type="button" className={tabClass(tab === 'password')} onClick={() => setTab('password')}>
                  {t('auth.tabPassword')}
                </button>
                <button type="button" className={tabClass(tab === 'code')} onClick={() => setTab('code')}>
                  {t('auth.tabCode')}
                </button>
              </div>

              {tab === 'password' ? (
                <form onSubmit={handleLogin} className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="email">{t('auth.email')}</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password">{t('auth.password')}</Label>
                      <Link href="/auth/forgot-password" className="text-xs underline underline-offset-4">
                        {t('auth.forgot')}
                      </Link>
                    </div>
                    <Input
                      id="password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                  {error && <p className="text-sm text-red-500">{error}</p>}
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? t('auth.loggingIn') : t('auth.loginBtn')}
                  </Button>
                </form>
              ) : (
                <EmailCodeForm mode="login" />
              )}

              <div className="text-center text-sm">
                {t('auth.noAccount')}{' '}
                <Link href="/auth/sign-up" className="underline underline-offset-4">
                  {t('auth.signup')}
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
