import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/navbar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import type { Key } from '@/lib/i18n/dictionaries'
import { Building2, FileText, Lock, MessageCircle, Plus, Search, ShieldCheck, UserRound, Zap } from 'lucide-react'
import { getI18n } from '@/lib/i18n/server'

const CARDS: { href: string; icon: typeof Search; title: Key; desc: Key }[] = [
  { href: '/jobs', icon: Search, title: 'home.jobsT', desc: 'home.jobsD' },
  { href: '/dashboard', icon: FileText, title: 'home.appsT', desc: 'home.appsD' },
  { href: '/employer', icon: Building2, title: 'home.myJobsT', desc: 'home.myJobsD' },
  { href: '/employer/jobs/new', icon: Plus, title: 'home.postT', desc: 'home.postD' },
  { href: '/chat', icon: MessageCircle, title: 'home.msgT', desc: 'home.msgD' },
  { href: '/profile', icon: UserRound, title: 'home.profT', desc: 'home.profD' },
]

export default async function HomePage() {
  const { t } = await getI18n()
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <div className="flex min-h-dvh flex-col">
      <Navbar initialUser={user} />

      <section className="border-b border-border bg-gradient-to-b from-primary/5 to-background">
        <div className="mx-auto max-w-6xl px-4 py-16 text-center sm:py-20">
          <div className="mx-auto mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-muted-foreground">
            <Zap className="h-3.5 w-3.5 text-primary" />
            {t('hero.badge')}
          </div>
          <h1 className="mx-auto max-w-2xl text-4xl font-bold tracking-tight text-balance sm:text-5xl">
            {t('hero.title')}
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-pretty text-muted-foreground">
            {t('hero.subtitle')}
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            {user ? (
              <Button asChild size="lg">
                <Link href="/jobs">
                  <Search className="mr-1 h-4 w-4" />
                  {t('hero.browse')}
                </Link>
              </Button>
            ) : (
              <>
                <Button asChild size="lg">
                  <Link href="/auth/sign-up">{t('hero.create')}</Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href="/auth/login">{t('nav.login')}</Link>
                </Button>
              </>
            )}
          </div>
          <div className="mt-6 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5 text-primary" />
            {t('hero.secure')}
          </div>
        </div>
      </section>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">
        {user ? (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold">{t('home.welcome')}</h2>
              <p className="text-sm text-muted-foreground">{t('home.welcomeSub')}</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {CARDS.map((c) => (
                <Link key={c.href} href={c.href} className="group">
                  <Card className="h-full transition-all hover:border-primary/50 hover:shadow-md">
                    <CardContent className="flex items-start gap-3 py-5">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <c.icon className="h-5 w-5" />
                      </span>
                      <span>
                        <span className="block font-semibold group-hover:text-primary">{t(c.title)}</span>
                        <span className="block text-sm text-muted-foreground">{t(c.desc)}</span>
                      </span>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        ) : (
          <div className="mx-auto flex max-w-md flex-col items-center gap-4 rounded-xl border border-border bg-card px-6 py-12 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Lock className="h-5 w-5" />
            </span>
            <h2 className="text-xl font-semibold">{t('home.lockedTitle')}</h2>
            <p className="text-sm text-muted-foreground">{t('home.lockedDesc')}</p>
            <div className="flex gap-3">
              <Button asChild>
                <Link href="/auth/login">{t('nav.login')}</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/auth/sign-up">{t('nav.createAccount')}</Link>
              </Button>
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        <p>{t('footer.text')}</p>
        <p className="mt-2 flex items-center justify-center gap-4">
          <Link href="/privacy" className="underline underline-offset-4">
            Privacy
          </Link>
          <Link href="/terms" className="underline underline-offset-4">
            Terms
          </Link>
        </p>
      </footer>
    </div>
  )
}
