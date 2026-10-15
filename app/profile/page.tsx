import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getI18n } from '@/lib/i18n/server'
import { Navbar } from '@/components/navbar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { Profile } from '@/lib/types'
import type { Key } from '@/lib/i18n/dictionaries'

export default async function ProfilePage() {
  const { t } = await getI18n()
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data, error: profileError } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle()
  if (profileError) console.error('profile load error:', profileError.message)
  const p = (data as Profile | null) ?? null
  const genderLabel = p?.gender ? t(`gender.${p.gender}` as Key) : ''

  const place = [p?.city, p?.region, p?.country].filter(Boolean).join(', ')
  const rate =
    p?.desired_hourly_rate != null
      ? `${p.desired_currency === 'USD' ? '$' : '₩'}${Number(p.desired_hourly_rate).toLocaleString('en-US')}${t('jobs.perHour')}`
      : ''
  const rows: [string, string | number | null | undefined][] = [
    [t('pf.fullName'), p?.full_name],
    [t('pf.email'), p?.email ?? user.email],
    [t('pf.phone'), p?.phone],
    [t('pf.gender'), genderLabel],
    [t('pf.locationSection'), place],
    [t('loc.address'), p?.address],
    [t('pf.headline'), p?.headline],
    [t('pf.company'), p?.current_company],
    [t('pf.experience'), p?.experience_years],
    [t('pf.skills'), p?.skills],
    [t('pf.languages'), p?.languages],
    [t('pf.education'), p?.education],
    [t('pf.desiredRate'), rate],
    [t('pf.portfolio'), p?.portfolio_url],
    [t('pf.about'), p?.bio],
  ]
  if (p?.company_name || p?.website || p?.company_description) {
    rows.push([t('pf.companyName'), p?.company_name], [t('pf.website'), p?.website], [t('pf.aboutCompany'), p?.company_description])
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <Navbar initialUser={user} />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            {p?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.avatar_url} alt="" className="h-16 w-16 rounded-full object-cover" />
            ) : (
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-xl font-semibold text-primary-foreground">
                {(p?.full_name ?? user.email ?? 'U').charAt(0).toUpperCase()}
              </span>
            )}
            <div>
              <h1 className="text-2xl font-bold">{p?.full_name || t('pf.title')}</h1>
              <p className="text-sm text-muted-foreground">{p?.headline || p?.email || user.email}</p>
            </div>
          </div>
          <Button asChild size="sm">
            <Link href="/settings">{t('pf.edit')}</Link>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('pf.sub')}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 text-sm">
            {rows.map(([label, value]) => (
              <div key={label} className="grid gap-0.5 sm:grid-cols-3 sm:gap-4">
                <span className="font-medium text-muted-foreground">{label}</span>
                <span className="whitespace-pre-line break-words sm:col-span-2">
                  {value === null || value === undefined || value === '' ? (
                    <span className="text-muted-foreground">{t('pf.empty')}</span>
                  ) : (
                    value
                  )}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
