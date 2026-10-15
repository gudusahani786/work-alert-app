import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getI18n } from '@/lib/i18n/server'
import { getSiteSettings, whatsappLink } from '@/lib/settings'
import { Navbar } from '@/components/navbar'
import { SupportForm } from '@/components/support-form'
import { RealtimeRefresh } from '@/components/realtime-refresh'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Mail, MessageCircle, Phone } from 'lucide-react'
import type { SupportTicket } from '@/lib/types'
import type { Key } from '@/lib/i18n/dictionaries'

const FAQ: [Key, Key][] = [
  ['help.q1', 'help.a1'],
  ['help.q2', 'help.a2'],
  ['help.q3', 'help.a3'],
  ['help.q4', 'help.a4'],
  ['help.q5', 'help.a5'],
]

function when(iso: string) {
  return new Date(iso).toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' })
}

export default async function HelpPage() {
  const { t } = await getI18n()
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const [{ data: profile }, { data: ticketsData }, settings] = await Promise.all([
    supabase.from('profiles').select('full_name').eq('id', user.id).maybeSingle(),
    supabase.from('support_tickets').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(30),
    getSiteSettings(),
  ])
  const tickets = (ticketsData as SupportTicket[]) ?? []
  const wa = whatsappLink(settings.support_whatsapp)

  return (
    <div className="flex min-h-dvh flex-col">
      <Navbar initialUser={user} />
      <RealtimeRefresh table="support_tickets" filter={`user_id=eq.${user.id}`} />
      <main className="mx-auto w-full max-w-2xl flex-1 space-y-6 px-4 py-8">
        <div>
          <h1 className="text-2xl font-bold">{t('sup.title')}</h1>
          <p className="text-sm text-muted-foreground">{t('sup.sub')}</p>
        </div>

        {settings.support_email || settings.support_phone || wa ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('sup.contact')}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {settings.support_email ? (
                <Button asChild variant="outline" size="sm">
                  <a href={`mailto:${settings.support_email}`}>
                    <Mail className="mr-1 h-4 w-4" /> {settings.support_email}
                  </a>
                </Button>
              ) : null}
              {settings.support_phone ? (
                <Button asChild variant="outline" size="sm">
                  <a href={`tel:${settings.support_phone.replace(/[^0-9+]/g, '')}`}>
                    <Phone className="mr-1 h-4 w-4" /> {settings.support_phone}
                  </a>
                </Button>
              ) : null}
              {wa ? (
                <Button asChild variant="outline" size="sm">
                  <a href={wa} target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="mr-1 h-4 w-4" /> {t('dev.whatsapp')}
                  </a>
                </Button>
              ) : null}
            </CardContent>
          </Card>
        ) : null}

        <Card>
          <CardContent className="pt-6">
            <SupportForm defaultName={profile?.full_name ?? ''} defaultEmail={user.email ?? ''} />
          </CardContent>
        </Card>

        <div className="space-y-3">
          <h2 className="text-lg font-semibold">{t('sup.mine')}</h2>
          {tickets.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('sup.none')}</p>
          ) : (
            tickets.map((tk) => (
              <Card key={tk.id}>
                <CardHeader className="gap-1">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base">{tk.subject}</CardTitle>
                    <Badge variant={tk.admin_reply ? 'default' : 'secondary'}>
                      {tk.admin_reply ? t('sup.reply') : t('sup.waiting')}
                    </Badge>
                  </div>
                  <CardDescription>{when(tk.created_at)}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <p className="whitespace-pre-line text-muted-foreground">{tk.message}</p>
                  {tk.admin_reply ? (
                    <div className="rounded-lg bg-muted p-3">
                      <p className="mb-1 text-xs font-semibold">{t('sup.reply')}</p>
                      <p className="whitespace-pre-line">{tk.admin_reply}</p>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('sup.faq')}</CardTitle>
          </CardHeader>
          <CardContent className="divide-y divide-border">
            {FAQ.map(([q, a]) => (
              <details key={q} className="group py-3">
                <summary className="cursor-pointer text-sm font-medium marker:text-primary">{t(q)}</summary>
                <p className="mt-2 text-sm text-muted-foreground">{t(a)}</p>
              </details>
            ))}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
