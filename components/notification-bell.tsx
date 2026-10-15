'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { Bell } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useI18n } from '@/lib/i18n/client'

// Bell with the number of unread notifications. Updates live.
export function NotificationBell({ userId }: { userId: string }) {
  const { t } = useI18n()
  const [count, setCount] = useState(0)

  const load = useCallback(async () => {
    const { count: c } = await createClient()
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .is('read_at', null)
    setCount(c ?? 0)
  }, [userId])

  useEffect(() => {
    load()
    const onNew = () => setCount((n) => n + 1)
    const onChange = () => load()
    window.addEventListener('wa:notification', onNew)
    window.addEventListener('wa:notifications-changed', onChange)
    return () => {
      window.removeEventListener('wa:notification', onNew)
      window.removeEventListener('wa:notifications-changed', onChange)
    }
  }, [load])

  return (
    <Link
      href="/notifications"
      aria-label={t('notif.title')}
      className="relative flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
    >
      <Bell className="h-5 w-5" />
      {count > 0 ? (
        <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
          {count > 99 ? '99+' : count}
        </span>
      ) : null}
    </Link>
  )
}
