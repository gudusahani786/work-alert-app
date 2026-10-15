import { requireAdmin } from '@/lib/admin'
import { saveSettings } from '@/app/admin/actions'
import { getSiteSettings } from '@/lib/settings'
import { AdminFlash, pick } from '@/components/admin-flash'
import { DevPhotoField } from '@/components/dev-photo-field'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

export default async function AdminSettingsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { user } = await requireAdmin()
  const sp = await searchParams
  const s = await getSiteSettings()

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <AdminFlash ok={pick(sp.ok)} error={pick(sp.error)} />
      <form action={saveSettings} className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Developer profile</CardTitle>
            <CardDescription>Shown to everyone on the Developer page (Settings → Developer).</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <DevPhotoField userId={user.id} initialUrl={s.dev_photo_url} />
            <div className="grid gap-2">
              <Label htmlFor="dev_name">Name</Label>
              <Input id="dev_name" name="dev_name" required maxLength={80} defaultValue={s.dev_name} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="dev_title">Title</Label>
              <Input id="dev_title" name="dev_title" maxLength={120} defaultValue={s.dev_title} placeholder="Founder & Developer" />
            </div>
            <div className="grid gap-2 sm:col-span-2">
              <Label htmlFor="dev_about">About me</Label>
              <Textarea id="dev_about" name="dev_about" rows={6} maxLength={3000} defaultValue={s.dev_about} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Help &amp; support contacts</CardTitle>
            <CardDescription>People can reach you here. Leave a box empty to hide that button.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2 sm:col-span-2">
              <Label htmlFor="support_email">Email</Label>
              <Input id="support_email" name="support_email" type="email" maxLength={200} defaultValue={s.support_email} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="support_phone">Phone</Label>
              <Input id="support_phone" name="support_phone" maxLength={40} defaultValue={s.support_phone} placeholder="+82 10 1234 5678" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="support_whatsapp">WhatsApp number</Label>
              <Input id="support_whatsapp" name="support_whatsapp" maxLength={40} defaultValue={s.support_whatsapp} placeholder="821012345678" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Announcement banner</CardTitle>
            <CardDescription>A bar shown at the top of every page. Leave empty to hide it.</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea name="announcement" rows={2} maxLength={300} defaultValue={s.announcement} />
          </CardContent>
        </Card>

        <Button type="submit">Save settings</Button>
      </form>
    </div>
  )
}
