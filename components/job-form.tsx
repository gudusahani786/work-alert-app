'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createJob, updateJob } from '@/app/actions'
import { LocationPicker, selectClass } from '@/components/location-picker'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { CATEGORIES, JOB_TYPES } from '@/lib/validate'
import { useI18n } from '@/lib/i18n/client'
import type { Job } from '@/lib/types'

export function JobForm({ defaultCompany, job, returnTo }: { defaultCompany: string; job?: Job; returnTo?: string }) {
  const { t, label } = useI18n()
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const handleSubmit = (formData: FormData) => {
    startTransition(async () => {
      const result = job ? await updateJob(job.id, formData) : await createJob(formData)
      if (result.ok) {
        toast.success(job ? t('jf.saved') : t('jf.posted'))
        router.push(returnTo ?? '/employer')
        router.refresh()
      } else {
        toast.error(result.error ?? t('common.error'))
      }
    })
  }

  return (
    <form action={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('jf.details')}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2 sm:col-span-2">
            <Label htmlFor="title">{t('jf.jobTitle')}</Label>
            <Input id="title" name="title" required maxLength={150} defaultValue={job?.title ?? ''} placeholder={t('jf.jobTitlePh')} />
          </div>
          <div className="grid gap-2 sm:col-span-2">
            <Label htmlFor="company">{t('jf.company')}</Label>
            <Input id="company" name="company" required maxLength={150} defaultValue={job?.company ?? defaultCompany} />
          </div>

          <LocationPicker
            allowRemote
            requiredCountry
            defaultCountry={job?.country}
            defaultRegion={job?.region}
            defaultCity={job?.city}
            defaultAddress={job?.address}
          />

          <div className="grid gap-2">
            <Label htmlFor="job_type">{t('jf.jobType')}</Label>
            <select id="job_type" name="job_type" required defaultValue={job?.job_type ?? 'Part-time'} className={selectClass}>
              {JOB_TYPES.map((x) => (
                <option key={x} value={x}>
                  {label('type', x)}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="category">{t('jf.category')}</Label>
            <select id="category" name="category" defaultValue={job?.category ?? 'Hospitality'} className={selectClass}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {label('cat', c)}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="pay_currency">{t('jf.currency')}</Label>
            <select id="pay_currency" name="pay_currency" defaultValue={job?.pay_currency ?? 'KRW'} className={selectClass}>
              <option value="KRW">₩ KRW (Korean won)</option>
              <option value="USD">$ USD (US dollar)</option>
            </select>
          </div>
          <div className="hidden sm:block" />
          <div className="grid gap-2">
            <Label htmlFor="hourly_min">{t('jf.hourlyMin')}</Label>
            <Input id="hourly_min" name="hourly_min" type="number" min={0} step="any" defaultValue={job?.hourly_min ?? ''} placeholder="11000" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="hourly_max">{t('jf.hourlyMax')}</Label>
            <Input id="hourly_max" name="hourly_max" type="number" min={0} step="any" defaultValue={job?.hourly_max ?? ''} placeholder="13000" />
          </div>
          <p className="text-xs text-muted-foreground sm:col-span-2">{t('jf.payHint')}</p>

          <div className="grid gap-2 sm:col-span-2">
            <Label htmlFor="description">{t('jf.description')}</Label>
            <Textarea
              id="description"
              name="description"
              required
              minLength={20}
              maxLength={5000}
              rows={6}
              defaultValue={job?.description ?? ''}
              placeholder={t('jf.descriptionPh')}
            />
          </div>
          <div className="grid gap-2 sm:col-span-2">
            <Label htmlFor="requirements">{t('jf.requirements')}</Label>
            <Textarea
              id="requirements"
              name="requirements"
              maxLength={3000}
              rows={4}
              defaultValue={job?.requirements ?? ''}
              placeholder={t('jf.requirementsPh')}
            />
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" disabled={isPending}>
              {job ? (isPending ? t('jf.saving') : t('jf.save')) : isPending ? t('jf.posting') : t('jf.post')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  )
}
