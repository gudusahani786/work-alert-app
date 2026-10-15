import { getI18n } from '@/lib/i18n/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ error: string }>
}) {
  const { t } = await getI18n()
  const params = await searchParams
  // URL se aata hai, isliye sirf error-code jaisa dikhe tabhi dikhao
  const code = params?.error
  const isErrorCode = typeof code === 'string' && /^[a-z0-9_]{1,64}$/.test(code)

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">{t('auth.errTitle')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {isErrorCode ? t('auth.errCode', { c: code }) : t('auth.errUnknown')}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
