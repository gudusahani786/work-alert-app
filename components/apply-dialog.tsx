'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { submitApplication } from '@/app/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useI18n } from '@/lib/i18n/client'
import { Send } from 'lucide-react'
import type { Job, Profile } from '@/lib/types'

export function ApplyDialog({
  job,
  profile,
  userEmail,
}: {
  job: Job
  profile: Profile | null
  userEmail: string
}) {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const handleSubmit = (formData: FormData) => {
    startTransition(async () => {
      const result = await submitApplication(formData)
      if (result.ok) {
        toast.success(t('apply.success'), { description: t('apply.successDesc') })
        setOpen(false)
        router.push('/dashboard')
        router.refresh()
      } else {
        toast.error(result.error ?? t('common.error'))
      }
    })
  }

  if (!open) {
    return (
      <Button size="lg" className="w-full sm:w-auto" onClick={() => setOpen(true)}>
        <Send className="mr-1 h-4 w-4" />
        {t('apply.button')}
      </Button>
    )
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <input type="hidden" name="job_id" value={job.id} />
      <div className="space-y-1">
        <h3 className="font-semibold">{t('apply.title', { t: job.title })}</h3>
        <p className="text-sm text-muted-foreground">{t('apply.hint')}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="full_name">{t('apply.fullName')}</Label>
          <Input id="full_name" name="full_name" required maxLength={200} defaultValue={profile?.full_name ?? ''} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="email">{t('apply.email')}</Label>
          <Input id="email" name="email" type="email" required maxLength={200} defaultValue={profile?.email ?? userEmail} />
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="phone">{t('apply.phone')}</Label>
        <Input id="phone" name="phone" maxLength={40} defaultValue={profile?.phone ?? ''} placeholder="+82 10 ..." />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="cover_letter">{t('apply.cover')}</Label>
        <Textarea id="cover_letter" name="cover_letter" maxLength={5000} rows={5} placeholder={t('apply.coverPh')} />
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? t('apply.submitting') : t('apply.submit')}
        </Button>
        <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={isPending}>
          {t('apply.cancel')}
        </Button>
      </div>
    </form>
  )
}
