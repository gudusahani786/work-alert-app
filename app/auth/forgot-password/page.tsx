'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LanguageSwitcher } from '@/components/language-switcher'
import { useI18n } from '@/lib/i18n/client'

// Forgot password: 1) enter email -> a code is emailed  2) enter the code + new password
export default function Page() {
  const { t } = useI18n()
  const router = useRouter()
  const [step, setStep] = useState<'email' | 'code'>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [pw, setPw] = useState('')
  const [pw2, setPw2] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const sendCode = async (e?: React.FormEvent) => {
    e?.preventDefault()
    setError(null)
    setBusy(true)
    const { error: err } = await createClient().auth.resetPasswordForEmail(email.trim())
    setBusy(false)
    if (err) {
      const { code: c, status } = err as { code?: string; status?: number }
      const limited = c === 'over_email_send_rate_limit' || c === 'over_request_rate_limit' || status === 429
      setError(t(limited ? 'auth.errRate' : 'auth.errGeneric'))
      return
    }
    setStep('code')
  }

  const resetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (pw.length < 6) return setError(t('set.passwordShort'))
    if (pw !== pw2) return setError(t('auth.mismatch'))
    setBusy(true)
    const supabase = createClient()
    const { error: vErr } = await supabase.auth.verifyOtp({ email: email.trim(), token: code.trim(), type: 'recovery' })
    if (vErr) {
      setBusy(false)
      return setError(t('auth.errCodeBad'))
    }
    const { error: uErr } = await supabase.auth.updateUser({ password: pw })
    setBusy(false)
    if (uErr) return setError(t('auth.errWeak'))
    toast.success(t('auth.resetDone'))
    router.push('/')
    router.refresh()
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="absolute right-4 top-4">
        <LanguageSwitcher />
      </div>
      <div className="w-full max-w-sm">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">{t('auth.forgotTitle')}</CardTitle>
            <CardDescription>
              {step === 'email' ? t('auth.forgotDesc') : t('auth.codeSentTo', { e: email.trim() })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {step === 'email' ? (
              <form onSubmit={sendCode} className="grid gap-4">
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
                {error && <p className="text-sm text-red-500">{error}</p>}
                <Button type="submit" className="w-full" disabled={busy}>
                  {busy ? t('auth.sending') : t('auth.sendResetCode')}
                </Button>
              </form>
            ) : (
              <form onSubmit={resetPassword} className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="code">{t('auth.codeLabel')}</Label>
                  <Input
                    id="code"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={10}
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\s/g, ''))}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="pw">{t('set.newPassword')}</Label>
                  <Input id="pw" type="password" minLength={6} required value={pw} onChange={(e) => setPw(e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="pw2">{t('set.repeatPassword')}</Label>
                  <Input id="pw2" type="password" minLength={6} required value={pw2} onChange={(e) => setPw2(e.target.value)} />
                </div>
                {error && <p className="text-sm text-red-500">{error}</p>}
                <Button type="submit" className="w-full" disabled={busy}>
                  {busy ? t('auth.resetting') : t('auth.resetBtn')}
                </Button>
                <button
                  type="button"
                  onClick={() => sendCode()}
                  disabled={busy}
                  className="text-sm underline underline-offset-4 disabled:opacity-50"
                >
                  {t('auth.resend')}
                </button>
              </form>
            )}
            <div className="mt-6 text-center text-sm">
              <Link href="/auth/login" className="underline underline-offset-4">
                {t('auth.backLogin')}
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
