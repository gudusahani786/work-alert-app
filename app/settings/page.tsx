import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getSiteSettings } from '@/lib/settings'
import { getI18n } from '@/lib/i18n/server'
import { Navbar } from '@/components/navbar'
import { ProfileForm } from '@/components/profile-form'
import { AccountSettings } from '@/components/account-settings'
import { LanguageCards } from '@/components/language-switcher'
import { NotificationSettings } from '@/components/notification-settings'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { Profile } from '@/lib/types'
import type { Key } from '@/lib/i18n/dictionaries'

const FAQ: [Key, Key][] = [
  ['help.q1', 'help.a1'],
  ['help.q2', 'help.a2'],
  ['help.q3', 'help.a3'],
  ['help.q4', 'help.a4'],
  ['help.q5', 'help.a5'],
]

export default async function SettingsPage() {
  const { t } = await getI18n()
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle()
  const site = await getSiteSettings()

  return (
    <div className="flex min-h-dvh flex-col">
      <Navbar initialUser={user} />
      <main className="mx-auto w-full max-w-2xl flex-1 space-y-6 px-4 py-8">
        <div>
          <h1 className="text-2xl font-bold">{t('set.title')}</h1>
          <p className="text-sm text-muted-foreground">{t('set.sub')}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('set.language')}</CardTitle>
            <CardDescription>{t('set.languageDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <LanguageCards />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('ns.title')}</CardTitle>
            <CardDescription>{t('ns.desc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <NotificationSettings />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('set.account')}</CardTitle>
          </CardHeader>
          <CardContent>
            <AccountSettings email={user.email ?? ''} />
          </CardContent>
        </Card>

        <div>
          <h2 className="mb-3 text-lg font-semibold">{t('set.profileSection')}</h2>
          <ProfileForm profile={(profile as Profile) ?? null} email={user.email ?? ''} userId={user.id} />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('set.developer')}</CardTitle>
            <CardDescription>{t('set.developerDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-bold tracking-wide">{site.dev_name}</p>
            <div className="mt-3">
              <Button asChild size="sm" variant="outline">
                <Link href="/developer">{t('dev.view')}</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('set.help')}</CardTitle>
            <CardDescription>{t('set.helpDesc')}</CardDescription>
          </CardHeader>
          <CardContent className="divide-y divide-border">
            {FAQ.map(([q, a]) => (
              <details key={q} className="group py-3">
                <summary className="cursor-pointer text-sm font-medium marker:text-primary">{t(q)}</summary>
                <p className="mt-2 text-sm text-muted-foreground">{t(a)}</p>
              </details>
            ))}
            <div className="pt-4">
              <Button asChild size="sm">
                <Link href="/help">{t('sup.open')}</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
