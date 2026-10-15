'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { updateProfile } from '@/app/actions'
import { createClient } from '@/lib/supabase/client'
import { LocationPicker, selectClass } from '@/components/location-picker'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useI18n } from '@/lib/i18n/client'
import { FileText, Upload } from 'lucide-react'
import type { Profile } from '@/lib/types'
import type { Key } from '@/lib/i18n/dictionaries'
import { GENDERS } from '@/lib/validate'

const AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export function ProfileForm({ profile, email, userId }: { profile: Profile | null; email: string; userId: string }) {
  const { t } = useI18n()
  const [isPending, startTransition] = useTransition()
  const [avatarUrl, setAvatarUrl] = useState<string | null>(profile?.avatar_url ?? null)
  const [resumePath, setResumePath] = useState<string | null>(profile?.resume_url ?? null)
  const [uploading, setUploading] = useState<'avatar' | 'resume' | null>(null)
  const router = useRouter()

  const handleSubmit = (formData: FormData) => {
    startTransition(async () => {
      const result = await updateProfile(formData)
      if (result.ok) {
        toast.success(t('pf.saved'))
        router.refresh()
      } else {
        toast.error(result.error ?? t('common.error'))
      }
    })
  }

  const uploadAvatar = async (file: File | undefined) => {
    if (!file) return
    if (!AVATAR_TYPES.includes(file.type)) return toast.error(t('pf.photoType'))
    if (file.size > 2 * 1024 * 1024) return toast.error(t('pf.photoSize'))
    setUploading('avatar')
    const supabase = createClient()
    const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg'
    const path = `${userId}/avatar-${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('avatars').upload(path, file, { contentType: file.type })
    if (error) {
      setUploading(null)
      return toast.error(t('pf.photoFail'))
    }
    const url = supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl
    const { error: e2 } = await supabase.from('profiles').upsert({ id: userId, avatar_url: url })
    setUploading(null)
    if (e2) return toast.error(t('pf.photoFail'))
    setAvatarUrl(url)
    toast.success(t('pf.photoSaved'))
    router.refresh()
  }

  const uploadResume = async (file: File | undefined) => {
    if (!file) return
    if (file.type !== 'application/pdf') return toast.error(t('pf.resumeType'))
    if (file.size > 5 * 1024 * 1024) return toast.error(t('pf.resumeSize'))
    setUploading('resume')
    const supabase = createClient()
    const path = `${userId}/resume-${Date.now()}.pdf`
    const { error } = await supabase.storage.from('resumes').upload(path, file, { contentType: 'application/pdf' })
    if (error) {
      setUploading(null)
      return toast.error(t('pf.resumeFail'))
    }
    const { error: e2 } = await supabase.from('profiles').upsert({ id: userId, resume_url: path })
    if (!e2 && resumePath) await supabase.storage.from('resumes').remove([resumePath])
    setUploading(null)
    if (e2) return toast.error(t('pf.resumeFail'))
    setResumePath(path)
    toast.success(t('pf.resumeSaved'))
    router.refresh()
  }

  const viewResume = async () => {
    if (!resumePath) return
    const w = window.open('', '_blank')
    const { data } = await createClient().storage.from('resumes').createSignedUrl(resumePath, 300)
    if (!data) {
      w?.close()
      return toast.error(t('ap.resumeFail'))
    }
    if (w) {
      w.opener = null
      w.location.href = data.signedUrl
    }
  }

  const initial = (profile?.full_name ?? email).charAt(0).toUpperCase()
  const btn =
    'inline-flex h-8 items-center gap-1.5 rounded-lg border border-border px-2.5 text-sm font-medium hover:bg-muted'

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('pf.photoResume')}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-4">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt="" className="h-16 w-16 rounded-full object-cover" />
            ) : (
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-xl font-semibold text-primary-foreground">
                {initial}
              </span>
            )}
            <label className="cursor-pointer">
              <span className={btn}>
                <Upload className="h-4 w-4" /> {uploading === 'avatar' ? t('pf.uploading') : t('pf.change')}
              </span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                disabled={uploading !== null}
                onChange={(e) => uploadAvatar(e.target.files?.[0])}
              />
            </label>
          </div>

          <div className="flex items-center gap-3">
            <label className="cursor-pointer">
              <span className={btn}>
                <FileText className="h-4 w-4" />
                {uploading === 'resume' ? t('pf.uploading') : resumePath ? t('pf.replaceResume') : t('pf.uploadResume')}
              </span>
              <input
                type="file"
                accept="application/pdf"
                className="sr-only"
                disabled={uploading !== null}
                onChange={(e) => uploadResume(e.target.files?.[0])}
              />
            </label>
            {resumePath ? (
              <Button type="button" variant="ghost" size="sm" onClick={viewResume}>
                {t('pf.view')}
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <form action={handleSubmit} className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('pf.personal')}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="full_name">{t('pf.fullName')}</Label>
              <Input id="full_name" name="full_name" maxLength={200} defaultValue={profile?.full_name ?? ''} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">{t('pf.email')}</Label>
              <Input id="email" value={profile?.email ?? email} disabled readOnly />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">{t('pf.phone')}</Label>
              <Input id="phone" name="phone" maxLength={40} defaultValue={profile?.phone ?? ''} placeholder="+82 10 ..." />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="gender">{t('pf.gender')}</Label>
              <select id="gender" name="gender" defaultValue={profile?.gender ?? ''} className={selectClass}>
                <option value="">{t('auth.genderSelect')}</option>
                {GENDERS.map((g) => (
                  <option key={g} value={g}>
                    {t(`gender.${g}` as Key)}
                  </option>
                ))}
              </select>
            </div>
            <p className="text-sm font-medium sm:col-span-2">{t('pf.locationSection')}</p>
            <LocationPicker
              defaultCountry={profile?.country}
              defaultRegion={profile?.region}
              defaultCity={profile?.city}
              defaultAddress={profile?.address}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('pf.work')}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2 sm:col-span-2">
              <Label htmlFor="headline">{t('pf.headline')}</Label>
              <Input id="headline" name="headline" maxLength={200} defaultValue={profile?.headline ?? ''} placeholder={t('pf.headlinePh')} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="current_company">{t('pf.company')}</Label>
              <Input id="current_company" name="current_company" maxLength={200} defaultValue={profile?.current_company ?? ''} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="experience_years">{t('pf.experience')}</Label>
              <Input id="experience_years" name="experience_years" type="number" min={0} max={60} defaultValue={profile?.experience_years ?? ''} placeholder="0" />
            </div>
            <div className="grid gap-2 sm:col-span-2">
              <Label htmlFor="skills">{t('pf.skills')}</Label>
              <Input id="skills" name="skills" maxLength={1000} defaultValue={profile?.skills ?? ''} placeholder={t('pf.skillsPh')} />
            </div>
            <div className="grid gap-2 sm:col-span-2">
              <Label htmlFor="languages">{t('pf.languages')}</Label>
              <Input id="languages" name="languages" maxLength={300} defaultValue={profile?.languages ?? ''} placeholder={t('pf.languagesPh')} />
            </div>
            <div className="grid gap-2 sm:col-span-2">
              <Label htmlFor="education">{t('pf.education')}</Label>
              <Input id="education" name="education" maxLength={1000} defaultValue={profile?.education ?? ''} placeholder={t('pf.educationPh')} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="desired_hourly_rate">{t('pf.desiredRate')}</Label>
              <Input id="desired_hourly_rate" name="desired_hourly_rate" type="number" min={0} step="any" defaultValue={profile?.desired_hourly_rate ?? ''} placeholder="12000" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="desired_currency">{t('pf.desiredCurrency')}</Label>
              <select id="desired_currency" name="desired_currency" defaultValue={profile?.desired_currency ?? 'KRW'} className={selectClass}>
                <option value="KRW">₩ KRW</option>
                <option value="USD">$ USD</option>
              </select>
            </div>
            <div className="grid gap-2 sm:col-span-2">
              <Label htmlFor="portfolio_url">{t('pf.portfolio')}</Label>
              <Input id="portfolio_url" name="portfolio_url" maxLength={300} defaultValue={profile?.portfolio_url ?? ''} placeholder="https://..." />
            </div>
            <div className="grid gap-2 sm:col-span-2">
              <Label htmlFor="bio">{t('pf.about')}</Label>
              <Textarea id="bio" name="bio" maxLength={3000} rows={5} defaultValue={profile?.bio ?? ''} placeholder={t('pf.aboutPh')} />
            </div>
          </CardContent>
        </Card>

        {/* Company details: jab aap hire karna chahte ho tab bharo (optional) */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('pf.companySection')}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="company_name">{t('pf.companyName')}</Label>
              <Input id="company_name" name="company_name" maxLength={200} defaultValue={profile?.company_name ?? ''} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="website">{t('pf.website')}</Label>
              <Input id="website" name="website" maxLength={300} defaultValue={profile?.website ?? ''} placeholder="https://..." />
            </div>
            <div className="grid gap-2 sm:col-span-2">
              <Label htmlFor="company_description">{t('pf.aboutCompany')}</Label>
              <Textarea id="company_description" name="company_description" maxLength={3000} rows={4} defaultValue={profile?.company_description ?? ''} />
            </div>
          </CardContent>
        </Card>

        <div>
          <Button type="submit" disabled={isPending}>
            {isPending ? t('pf.saving') : t('pf.save')}
          </Button>
        </div>
      </form>
    </div>
  )
}
