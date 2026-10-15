'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { jitsiUrl, type CallMode } from '@/lib/jitsi'
import { useI18n } from '@/lib/i18n/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Check, CheckCheck, Phone, Send, Video } from 'lucide-react'
import type { Message } from '@/lib/types'

type Props = {
  conversationId: string
  meId: string
  meName: string
  otherName: string
  jobTitle: string
  initialMessages: Message[]
  locked: boolean
}

function time(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export function ChatRoom({ conversationId, meId, meName, otherName, jobTitle, initialMessages, locked }: Props) {
  const { t } = useI18n()
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  const upsert = useCallback((m: Message) => {
    setMessages((prev) => {
      const i = prev.findIndex((x) => x.id === m.id)
      if (i === -1) return [...prev, m]
      const copy = prev.slice()
      copy[i] = m
      return copy
    })
  }, [])

  const markRead = useCallback(async () => {
    const supabase = createClient()
    await supabase.rpc('mark_conversation_read', { p_conversation_id: conversationId })
  }, [conversationId])

  useEffect(() => {
    const supabase = createClient()
    markRead()
    const channel = supabase
      .channel(`chat-${conversationId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
        (payload) => {
          const m = payload.new as Message
          upsert(m)
          if (m.sender_id !== meId) markRead()
        },
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
        (payload) => upsert(payload.new as Message),
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [conversationId, meId, markRead, upsert])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  const insertMessage = async (kind: 'text' | 'call', body: string) => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('messages')
      .insert({ conversation_id: conversationId, kind, body })
      .select()
      .single()
    if (error) {
      toast.error(
        error.message.includes('rate_limit')
          ? t('chat.tooFast')
          : t('chat.sendFail'),
      )
      return false
    }
    upsert(data as Message)
    return true
  }

  const send = async (e: React.FormEvent) => {
    e.preventDefault()
    const body = text.trim().slice(0, 2000)
    if (!body || sending || locked) return
    setSending(true)
    const ok = await insertMessage('text', body)
    if (ok) setText('')
    setSending(false)
  }

  const startCall = (mode: CallMode) => {
    if (locked) return
    // Popup blocker se bachne ke liye pehle window kholo, phir invite bhejo
    window.open(jitsiUrl(conversationId, mode, meName), '_blank', 'noopener,noreferrer')
    insertMessage('call', mode)
  }

  return (
    <div className="flex h-[calc(100dvh-10rem)] min-h-[360px] flex-col lg:h-[calc(100dvh-7.25rem)]">
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div className="min-w-0">
          <p className="truncate font-semibold">{otherName}</p>
          <p className="truncate text-xs text-muted-foreground">{jobTitle}</p>
        </div>
        <div className="flex gap-2">
          <Button type="button" size="sm" variant="outline" onClick={() => startCall('voice')} disabled={locked}>
            <Phone className="mr-1 h-4 w-4" /> {t('chat.call')}
          </Button>
          <Button type="button" size="sm" onClick={() => startCall('video')} disabled={locked}>
            <Video className="mr-1 h-4 w-4" /> {t('chat.video')}
          </Button>
        </div>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto bg-muted/30 px-4 py-4">
        {messages.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            {t('chat.hello')}
          </p>
        ) : null}
        {messages.map((m) => {
          const mine = m.sender_id === meId
          return (
            <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                  mine ? 'bg-primary text-primary-foreground' : 'bg-background ring-1 ring-border'
                }`}
              >
                {m.kind === 'call' ? (
                  <div className="flex flex-col gap-1">
                    <span className="flex items-center gap-1.5 font-medium">
                      {m.body === 'voice' ? <Phone className="h-4 w-4" /> : <Video className="h-4 w-4" />}
                      {mine
                        ? t('chat.youStarted', { m: m.body === 'voice' ? t('chat.voice') : t('chat.videoWord') })
                        : t('chat.incoming', { m: m.body === 'voice' ? t('chat.voice') : t('chat.videoWord') })}
                    </span>
                    <a
                      href={jitsiUrl(conversationId, m.body === 'voice' ? 'voice' : 'video', meName)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline underline-offset-2"
                    >
                      {t('chat.join')}
                    </a>
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap break-words">{m.body}</p>
                )}
                <div
                  className={`mt-1 flex items-center justify-end gap-1 text-[10px] ${
                    mine ? 'text-primary-foreground/70' : 'text-muted-foreground'
                  }`}
                >
                  <span suppressHydrationWarning>{time(m.created_at)}</span>
                  {mine ? m.read_at ? <CheckCheck className="h-3 w-3" /> : <Check className="h-3 w-3" /> : null}
                </div>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {locked ? (
        <p className="border-t border-border px-4 py-3 text-center text-sm text-muted-foreground">
          {t('chat.locked')}
        </p>
      ) : (
        <form onSubmit={send} className="flex gap-2 border-t border-border p-3">
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={t('chat.type')}
            maxLength={2000}
            autoComplete="off"
          />
          <Button type="submit" disabled={sending || !text.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      )}
    </div>
  )
}
