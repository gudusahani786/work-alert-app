'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useI18n } from '@/lib/i18n/client'
import { LogOut } from 'lucide-react'

export function AccountSettings({ email }: { email: string }) {
  const { t } = useI18n()
  const router = useRouter()
  const [newEmail, setNewEmail] = useState('')
  const [pw, setPw] = useState('')
  const [pw2, setPw2] = useState('')
  const [busy, setBusy] = useState<'email' | 'pw' | null>(null)

  const changeEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newEmail.trim()) return
    setBusy('email')
    const { error } = await createClient().auth.updateUser({ email: newEmail.trim() })
    setBusy(null)
    if (error) return toast.error(t('auth.errGeneric'))
    setNewEmail('')
    toast.success(t('set.emailSent'))
  }

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (pw.length < 6) return toast.error(t('set.passwordShort'))
    if (pw !== pw2) return toast.error(t('auth.mismatch'))
    setBusy('pw')
    const { error } = await createClient().auth.updateUser({ password: pw })
    setBusy(null)
    if (error) return toast.error(t('auth.errWeak'))
    setPw('')
    setPw2('')
    toast.success(t('set.passwordUpdated'))
  }

  const signOut = async () => {
    await createClient().auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <div className="grid gap-6">
      <form onSubmit={changeEmail} className="grid gap-3">
        <div className="grid gap-2">
          <Label>{t('set.currentEmail')}</Label>
          <Input value={email} disabled readOnly />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="new-email">{t('set.newEmail')}</Label>
          <Input id="new-email" type="email" maxLength={200} value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
        </div>
        <div>
          <Button type="submit" variant="outline" disabled={busy !== null || !newEmail.trim()}>
            {t('set.updateEmail')}
          </Button>
        </div>
      </form>

      <form onSubmit={changePassword} className="grid gap-3 border-t border-border pt-6">
        <div className="grid gap-2">
          <Label htmlFor="new-pw">{t('set.newPassword')}</Label>
          <Input id="new-pw" type="password" minLength={6} value={pw} onChange={(e) => setPw(e.target.value)} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="new-pw2">{t('set.repeatPassword')}</Label>
          <Input id="new-pw2" type="password" minLength={6} value={pw2} onChange={(e) => setPw2(e.target.value)} />
        </div>
        <div>
          <Button type="submit" variant="outline" disabled={busy !== null || !pw}>
            {t('set.updatePassword')}
          </Button>
        </div>
      </form>

      <div className="border-t border-border pt-6">
        <Button type="button" variant="destructive" onClick={signOut}>
          <LogOut className="mr-1 h-4 w-4" /> {t('set.signOut')}
        </Button>
      </div>
    </div>
  )
}
