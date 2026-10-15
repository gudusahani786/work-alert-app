'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { jitsiUrl } from '@/lib/jitsi'
import { useI18n } from '@/lib/i18n/client'
import { notifText } from '@/lib/notif-text'
import {
  playMessageSound,
  playNotifySound,
  showSystemNotification,
  startRingtone,
  unlockAudio,
} from '@/lib/sounds'
import type { AppNotification, Message } from '@/lib/types'

// On every page: new message, incoming call (with ringing), new job and other notifications.
export function GlobalNotifier() {
  const [userId, setUserId] = useState<string | null>(null)
  const pathname = usePathname()
  const router = useRouter()
  const i18n = useI18n()

  // Keep the latest values in refs, so the live connection is not rebuilt on every page change.
  const pathRef = useRef(pathname)
  const i18nRef = useRef(i18n)
  const routerRef = useRef(router)
  useEffect(() => {
    pathRef.current = pathname
    i18nRef.current = i18n
    routerRef.current = router
  }, [pathname, i18n, router])

  // Browsers allow sound only after the first tap/click/key.
  useEffect(() => {
    const unlock = () => unlockAudio()
    window.addEventListener('pointerdown', unlock)
    window.addEventListener('keydown', unlock)
    return () => {
      window.removeEventListener('pointerdown', unlock)
      window.removeEventListener('keydown', unlock)
    }
  }, [])

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null))
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_e, session) => setUserId(session?.user?.id ?? null))
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!userId) return
    const supabase = createClient()
    let stopRing: (() => void) | null = null
    const stopRinging = () => {
      if (stopRing) {
        stopRing()
        stopRing = null
      }
    }

    const channel = supabase
      .channel(`notify-${userId}`)
      // ---- chat messages and calls ----
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        const { t } = i18nRef.current
        const m = payload.new as Message
        if (m.sender_id === userId) return

        if (m.kind === 'call') {
          const mode = m.body === 'voice' ? 'voice' : 'video'
          const callText = t('chat.incoming', { m: mode === 'voice' ? t('chat.voice') : t('chat.videoWord') })
          stopRinging()
          stopRing = startRingtone(30000)
          showSystemNotification(callText, t('chat.joinDesc'), `/chat/${m.conversation_id}`)
          toast(callText, {
            description: t('chat.joinDesc'),
            duration: 30000,
            action: {
              label: t('chat.join2'),
              onClick: () => {
                stopRinging()
                window.open(jitsiUrl(m.conversation_id, mode), '_blank', 'noopener,noreferrer')
              },
            },
            onDismiss: stopRinging,
            onAutoClose: stopRinging,
          })
          return
        }

        // Already looking at this chat: no popup
        if (pathRef.current?.startsWith(`/chat/${m.conversation_id}`)) {
          playMessageSound()
          return
        }
        playMessageSound()
        showSystemNotification(t('chat.newMsg'), m.body.slice(0, 80), `/chat/${m.conversation_id}`)
        toast(t('chat.newMsg'), {
          description: m.body.slice(0, 80),
          action: {
            label: t('chat.open'),
            onClick: () => routerRef.current.push(`/chat/${m.conversation_id}`),
          },
        })
      })
      // ---- notifications (new job, new applicant, approved, announcements ...) ----
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        (payload) => {
          const { t } = i18nRef.current
          const n = payload.new as AppNotification
          const text = notifText(n, t)
          window.dispatchEvent(new CustomEvent('wa:notification', { detail: n }))
          playNotifySound()
          showSystemNotification(text.title, text.body, n.link ?? undefined)
          toast(text.title, {
            description: text.body || undefined,
            duration: 8000,
            action: n.link
              ? { label: t('chat.open'), onClick: () => routerRef.current.push(n.link as string) }
              : undefined,
          })
        },
      )
      .subscribe()

    return () => {
      stopRinging()
      supabase.removeChannel(channel)
    }
  }, [userId])

  return null
}
