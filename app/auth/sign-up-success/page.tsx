import Link from 'next/link'
import { getI18n } from '@/lib/i18n/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default async function Page() {
  const { t } = await getI18n()
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">{t('auth.successTitle')}</CardTitle>
            <CardDescription>{t('auth.successSub')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">{t('auth.successBody')}</p>
            <Link href="/auth/login" className="text-sm underline underline-offset-4">
              {t('auth.login')}
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
