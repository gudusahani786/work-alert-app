'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useI18n } from '@/lib/i18n/client'

type Props = {
  mode: 'login' | 'signup'
  // Signup me name/phone/gender ke fields (parent se aate hain) + unki validation
  meta?: { full_name: string; phone: string; gender: string }
  extra?: React.ReactNode
  validate?: () => string | null
}

// Email me aaya code daalke login (Gmail / koi bhi email). Password ki zaroorat nahi.
export function EmailCodeForm({ mode, meta, extra, validate }: Props) {
  const { t } = useI18n()
  const router = useRouter()
  const [step, setStep] = useState<'email' | 'code'>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [cooldown, setCooldown] = useState(0)

  useEffect(() => {
    if (cooldown <= 0) return
    const id = setTimeout(() => setCooldown((c) => c - 1), 1000)
    return () => clearTimeout(id)
  }, [cooldown])

  const sendCode = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (loading || cooldown > 0) return
    setError(null)
    const problem = mode === 'signup' && validate ? validate() : null
    if (problem) return setError(problem)
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        shouldCreateUser: mode === 'signup',
        ...(mode === 'signup'
          ? {
              data: {
                full_name: (meta?.full_name ?? '').trim().slice(0, 200),
                phone: (meta?.phone ?? '').trim().slice(0, 40),
                gender: meta?.gender ?? '',
              },
            }
          : {}),
      },
    })
    setLoading(false)
    if (error) {
      console.error('OTP send error:', error)
      const c = (error as { code?: string; status?: number }).code
      const st = (error as { status?: number }).status
      if (c === 'otp_disabled' || /signups not allowed/i.test(error.message)) setError(t('auth.errNoAccount'))
      else if (c === 'over_email_send_rate_limit' || c === 'over_request_rate_limit' || st === 429) setError(t('auth.errRate'))
      else if (c === 'email_address_invalid') setError(t('auth.errEmailInvalid'))
      else if (c === 'email_address_not_authorized') setError(t('auth.errEmailNotAllowed'))
      else if (c === 'signup_disabled') setError(t('auth.errSignupOff'))
      else if (/confirmation email|sending (magic|email)|smtp/i.test(error.message)) setError(t('auth.errEmailSend'))
      else if (/database error/i.test(error.message) || (st !== undefined && st >= 500)) setError(t('auth.errServer'))
      else setError(t('auth.errGeneric'))
      return
    }
    setStep('code')
    setCooldown(60)
  }

  const verify = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: code.replace(/\s/g, ''),
      type: 'email',
    })
    if (error) {
      console.error('OTP verify error:', error)
      setError(t('auth.errBadCode'))
      setLoading(false)
      return
    }
    router.push('/')
    router.refresh()
  }

  if (step === 'email') {
    return (
      <form onSubmit={sendCode} className="grid gap-4">
        {extra}
        <div className="grid gap-2">
          <Label htmlFor="otp-email">{t('auth.email')}</Label>
          <Input
            id="otp-email"
            type="email"
            required
            placeholder="you@gmail.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <Button type="submit" className="w-full" disabled={loading || !email.trim()}>
          {loading ? t('auth.sending') : t('auth.sendCode')}
        </Button>
      </form>
    )
  }

  return (
    <form onSubmit={verify} className="grid gap-4">
      <p className="text-sm text-muted-foreground">{t('auth.codeSent', { e: email.trim() })}</p>
      <div className="grid gap-2">
        <Label htmlFor="otp-code">{t('auth.enterCode')}</Label>
        <Input
          id="otp-code"
          inputMode="numeric"
          autoComplete="one-time-code"
          required
          maxLength={12}
          placeholder="123456"
          className="text-center text-lg tracking-widest"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/[^0-9\s]/g, ''))}
        />
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
      <Button type="submit" className="w-full" disabled={loading || code.replace(/\s/g, '').length < 6}>
        {loading ? t('auth.verifying') : t('auth.verify')}
      </Button>
      <div className="flex items-center justify-between text-sm">
        <button
          type="button"
          className="underline underline-offset-4 disabled:no-underline disabled:opacity-50"
          disabled={cooldown > 0 || loading}
          onClick={() => sendCode()}
        >
          {cooldown > 0 ? t('auth.resendIn', { s: cooldown }) : t('auth.resend')}
        </button>
        <button
          type="button"
          className="underline underline-offset-4"
          onClick={() => {
            setStep('email')
            setCode('')
            setError(null)
          }}
        >
          {t('auth.changeEmail')}
        </button>
      </div>
    </form>
  )
}
