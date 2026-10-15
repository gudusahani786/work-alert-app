'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

// Admin: upload the developer photo (saved in the public "avatars" bucket inside the admin's own folder).
export function DevPhotoField({ userId, initialUrl }: { userId: string; initialUrl: string }) {
  const [url, setUrl] = useState(initialUrl)
  const [busy, setBusy] = useState(false)

  const upload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) return toast.error('Use a JPG, PNG or WebP image.')
    if (file.size > 2 * 1024 * 1024) return toast.error('The image must be smaller than 2 MB.')
    setBusy(true)
    const supabase = createClient()
    const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg'
    const path = `${userId}/developer-${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('avatars').upload(path, file, { contentType: file.type })
    if (error) {
      setBusy(false)
      console.error('developer photo error:', error.message)
      return toast.error('Upload failed.')
    }
    const { data } = supabase.storage.from('avatars').getPublicUrl(path)
    setUrl(data.publicUrl)
    setBusy(false)
    toast.success('Photo uploaded. Click Save to keep it.')
  }

  return (
    <div className="grid gap-2 sm:col-span-2">
      <Label htmlFor="dev-photo">Developer photo</Label>
      <div className="flex items-center gap-4">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted text-xs text-muted-foreground">
          {url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt="" className="h-full w-full object-cover" />
          ) : (
            'No photo'
          )}
        </div>
        <Input id="dev-photo" type="file" accept="image/jpeg,image/png,image/webp" onChange={upload} disabled={busy} />
      </div>
      <input type="hidden" name="dev_photo_url" value={url} />
    </div>
  )
}
