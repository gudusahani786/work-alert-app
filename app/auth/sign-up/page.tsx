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
import { GENDERS, isPhone } from '@/lib/validate'
import { selectClass } from '@/components/location-picker'

function signUpErrorKey(error: unknown): Key {
  const { code, status, message } = (error ?? {}) as { code?: string; status?: number; message?: string }
  const msg = (message ?? '').toLowerCase()
  if (code === 'weak_password') return 'auth.errWeak'
  if (code === 'email_address_invalid') return 'auth.errEmailInvalid'
  if (code === 'email_address_not_authorized') return 'auth.errEmailNotAllowed'
  if (code === 'over_email_send_rate_limit' || code === 'over_request_rate_limit' || status === 429) return 'auth.errRate'
  if (code === 'user_already_exists' || code === 'email_exists' || msg.includes('already registered')) return 'auth.errExists'
  if (code === 'signup_disabled' || msg.includes('signups not allowed')) return 'auth.errSignupOff'
  if (msg.includes('confirmation email') || msg.includes('sending email') || msg.includes('smtp')) return 'auth.errEmailSend'
  if (msg.includes('database error') || (status !== undefined && status >= 500)) return 'auth.errServer'
  return 'auth.errSignup'
}

export default function Page() {
  const { t } = useI18n()
  const [tab, setTab] = useState<'password' | 'code'>('password')
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [gender, setGender] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [repeatPassword, setRepeatPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [errorCode, setErrorCode] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const detailsError = (): string | null => {
    if (!fullName.trim()) return t('auth.errName')
    if (!isPhone(phone.trim())) return t('auth.errPhone')
    if (!(GENDERS as readonly string[]).includes(gender)) return t('auth.errGender')
    return null
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setError(null)
    setErrorCode(null)
    const problem = detailsError()
    if (problem) return setError(problem)
    setIsLoading(true)

    if (password !== repeatPassword) {
      setError(t('auth.mismatch'))
      setIsLoading(false)
      return
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { full_name: fullName.trim().slice(0, 200), phone: phone.trim().slice(0, 40), gender },
          emailRedirectTo:
            process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ??
            `${window.location.origin}/auth/callback?next=/`,
        },
      })
      if (error) throw error
      // Email already registered: Supabase returns a fake user with no identities
      if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
        setError(t('auth.errExists'))
        return
      }
      // "Confirm email" OFF ho to session turant mil jata hai
      if (data.session) {
        router.push('/')
        router.refresh()
      } else {
        router.push('/auth/sign-up-success')
      }
    } catch (error: unknown) {
      console.error('Sign-up error:', error)
      setError(t(signUpErrorKey(error)))
      const { code, message } = (error ?? {}) as { code?: string; message?: string }
      setErrorCode(code ?? message ?? null)
    } finally {
      setIsLoading(false)
    }
  }

  const tabClass = (active: boolean) =>
    `flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
      active ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'
    }`

  const detailFields = (
    <>
      <div className="grid gap-2">
        <Label htmlFor="full-name">{t('auth.fullName')}</Label>
        <Input
          id="full-name"
          required
          maxLength={200}
          autoComplete="name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="phone">{t('auth.phone')}</Label>
        <Input
          id="phone"
          type="tel"
          required
          maxLength={40}
          autoComplete="tel"
          placeholder="+82 10 1234 5678"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="gender">{t('auth.gender')}</Label>
        <select
          id="gender"
          required
          value={gender}
          onChange={(e) => setGender(e.target.value)}
          className={selectClass}
        >
          <option value="" disabled>
            {t('auth.genderSelect')}
          </option>
          {GENDERS.map((g) => (
            <option key={g} value={g}>
              {t(`gender.${g}` as Key)}
            </option>
          ))}
        </select>
      </div>
    </>
  )

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="absolute right-4 top-4">
        <LanguageSwitcher />
      </div>
      <div className="w-full max-w-sm">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">{t('auth.signup')}</CardTitle>
            <CardDescription>{t('auth.signupDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-6">
              <GoogleButton label={t('auth.googleSignup')} />
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
                <form onSubmit={handleSignUp} className="grid gap-4">
                  {detailFields}
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
                    <Label htmlFor="password">{t('auth.password')}</Label>
                    <Input
                      id="password"
                      type="password"
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="repeat-password">{t('auth.repeatPassword')}</Label>
                    <Input
                      id="repeat-password"
                      type="password"
                      required
                      value={repeatPassword}
                      onChange={(e) => setRepeatPassword(e.target.value)}
                    />
                  </div>
                  {error && <p className="text-sm text-red-500">{error}</p>}
                  {error && errorCode ? (
                    <p className="break-words text-xs text-muted-foreground">{t('auth.errCodeLabel', { c: errorCode })}</p>
                  ) : null}
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? t('auth.signingUp') : t('auth.signupBtn')}
                  </Button>
                </form>
              ) : (
                <EmailCodeForm
                  mode="signup"
                  meta={{ full_name: fullName, phone, gender }}
                  extra={detailFields}
                  validate={detailsError}
                />
              )}

              <div className="text-center text-sm">
                {t('auth.haveAccount')}{' '}
                <Link href="/auth/login" className="underline underline-offset-4">
                  {t('auth.login')}
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
