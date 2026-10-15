import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getI18n } from '@/lib/i18n/server'
import { getSiteSettings, whatsappLink } from '@/lib/settings'
import { Navbar } from '@/components/navbar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Mail, MessageCircle, Pencil, Phone } from 'lucide-react'

// Public page: developer photo, name and about. The admin edits it in Admin > Settings.
export default async function DeveloperPage() {
  const { t } = await getI18n()
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const settings = await getSiteSettings()
  const wa = whatsappLink(settings.support_whatsapp)

  let isAdmin = false
  if (user) {
    const { data: me } = await supabase.from('profiles').select('is_admin').eq('id', user.id).maybeSingle()
    isAdmin = !!me?.is_admin
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <Navbar initialUser={user} />
      <main className="mx-auto w-full max-w-xl flex-1 px-4 py-8">
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-8 text-center">
            <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full bg-primary text-4xl font-bold text-primary-foreground">
              {settings.dev_photo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={settings.dev_photo_url} alt={settings.dev_name} className="h-full w-full object-cover" />
              ) : (
                settings.dev_name.charAt(0).toUpperCase()
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-wide">{settings.dev_name}</h1>
              {settings.dev_title ? <p className="text-sm text-muted-foreground">{settings.dev_title}</p> : null}
            </div>
            <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
              {settings.dev_about || t('dev.noAbout')}
            </p>

            <div className="flex flex-wrap justify-center gap-2">
              {settings.support_email ? (
                <Button asChild variant="outline" size="sm">
                  <a href={`mailto:${settings.support_email}`}>
                    <Mail className="mr-1 h-4 w-4" /> {t('dev.email')}
                  </a>
                </Button>
              ) : null}
              {settings.support_phone ? (
                <Button asChild variant="outline" size="sm">
                  <a href={`tel:${settings.support_phone.replace(/[^0-9+]/g, '')}`}>
                    <Phone className="mr-1 h-4 w-4" /> {t('dev.call')}
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
            </div>

            <div className="flex flex-wrap justify-center gap-2 border-t border-border pt-4">
              {user ? (
                <Button asChild size="sm">
                  <Link href="/help">{t('dev.contact')}</Link>
                </Button>
              ) : null}
              {isAdmin ? (
                <Button asChild size="sm" variant="outline">
                  <Link href="/admin/settings">
                    <Pencil className="mr-1 h-4 w-4" /> {t('emp.edit')}
                  </Link>
                </Button>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
