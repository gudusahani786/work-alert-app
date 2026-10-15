'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useI18n } from '@/lib/i18n/client'
import { notifText } from '@/lib/notif-text'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import type { AppNotification } from '@/lib/types'

function when(iso: string) {
  return new Date(iso).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export function NotificationList({ userId, items }: { userId: string; items: AppNotification[] }) {
  const { t } = useI18n()
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  const changed = () => {
    window.dispatchEvent(new Event('wa:notifications-changed'))
    router.refresh()
  }

  const openItem = async (n: AppNotification) => {
    if (!n.read_at) {
      await createClient().from('notifications').update({ read_at: new Date().toISOString() }).eq('id', n.id)
      window.dispatchEvent(new Event('wa:notifications-changed'))
    }
    if (n.link) router.push(n.link)
    else router.refresh()
  }

  const markAll = async () => {
    setBusy(true)
    await createClient()
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('user_id', userId)
      .is('read_at', null)
    setBusy(false)
    changed()
  }

  const clearAll = async () => {
    setBusy(true)
    await createClient().from('notifications').delete().eq('user_id', userId)
    setBusy(false)
    changed()
  }

  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="py-16 text-center text-muted-foreground">{t('notif.empty')}</CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={markAll} disabled={busy}>
          {t('notif.markAll')}
        </Button>
        <Button size="sm" variant="outline" onClick={clearAll} disabled={busy}>
          {t('notif.clear')}
        </Button>
      </div>
      <div className="flex flex-col gap-2">
        {items.map((n) => {
          const text = notifText(n, t)
          return (
            <button
              key={n.id}
              type="button"
              onClick={() => openItem(n)}
              className={`w-full rounded-lg border p-3 text-left transition-colors hover:bg-muted ${
                n.read_at ? 'border-border' : 'border-primary/40 bg-primary/5'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <span className={`text-sm ${n.read_at ? '' : 'font-semibold'}`}>{text.title}</span>
                {!n.read_at ? <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" /> : null}
              </div>
              {text.body ? <p className="mt-1 text-sm text-muted-foreground">{text.body}</p> : null}
              <p className="mt-1 text-xs text-muted-foreground">{when(n.created_at)}</p>
            </button>
          )
        })}
      </div>
    </div>
  )
}
