'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { useI18n } from '@/lib/i18n/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

export function SupportForm({ defaultName, defaultEmail }: { defaultName: string; defaultEmail: string }) {
  const { t } = useI18n()
  const router = useRouter()
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!subject.trim() || !message.trim()) return
    setBusy(true)
    const { error } = await createClient()
      .from('support_tickets')
      .insert({
        name: defaultName || null,
        email: defaultEmail || null,
        subject: subject.trim().slice(0, 200),
        message: message.trim().slice(0, 3000),
      })
    setBusy(false)
    if (error) {
      console.error('support ticket error:', error.message)
      return toast.error(t('common.error'))
    }
    toast.success(t('sup.sent'))
    setSubject('')
    setMessage('')
    router.refresh()
  }

  return (
    <form onSubmit={submit} className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="sup-subject">{t('sup.subject')}</Label>
        <Input id="sup-subject" required maxLength={200} value={subject} onChange={(e) => setSubject(e.target.value)} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="sup-message">{t('sup.message')}</Label>
        <Textarea
          id="sup-message"
          required
          rows={5}
          maxLength={3000}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
      </div>
      <div>
        <Button type="submit" disabled={busy || !subject.trim() || !message.trim()}>
          {t('sup.send')}
        </Button>
      </div>
    </form>
  )
}
