import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getI18n } from '@/lib/i18n/server'
import { Navbar } from '@/components/navbar'
import { NotificationList } from '@/components/notification-list'
import { RealtimeRefresh } from '@/components/realtime-refresh'
import type { AppNotification } from '@/lib/types'

export default async function NotificationsPage() {
  const { t } = await getI18n()
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(60)

  return (
    <div className="flex min-h-dvh flex-col">
      <Navbar initialUser={user} />
      <RealtimeRefresh table="notifications" filter={`user_id=eq.${user.id}`} />
      <main className="mx-auto w-full max-w-2xl flex-1 space-y-4 px-4 py-8">
        <h1 className="text-2xl font-bold">{t('notif.title')}</h1>
        <NotificationList userId={user.id} items={(data as AppNotification[]) ?? []} />
      </main>
    </div>
  )
}
