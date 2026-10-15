'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

// Table me koi bhi change (insert/update/delete) hote hi page ka data auto-refresh kar deta hai.
export function RealtimeRefresh({ table, filter }: { table: string; filter?: string }) {
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    let timer: ReturnType<typeof setTimeout> | null = null
    const channel = supabase
      .channel(`refresh-${table}-${filter ?? 'all'}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table, ...(filter ? { filter } : {}) },
        () => {
          if (timer) clearTimeout(timer)
          timer = setTimeout(() => router.refresh(), 300)
        },
      )
      .subscribe()
    return () => {
      if (timer) clearTimeout(timer)
      supabase.removeChannel(channel)
    }
  }, [table, filter, router])

  return null
}
