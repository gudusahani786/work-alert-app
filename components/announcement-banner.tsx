import { getSiteSettings } from '@/lib/settings'

// Simple banner at the top of every page. The admin edits the text in Admin > Settings.
export async function AnnouncementBanner() {
  const { announcement } = await getSiteSettings()
  const text = announcement.trim()
  if (!text) return null
  return (
    <div className="bg-primary px-4 py-2 text-center text-sm text-primary-foreground" role="status">
      {text}
    </div>
  )
}
