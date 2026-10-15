import { requireAdmin } from '@/lib/admin'
import { broadcast } from '@/app/admin/actions'
import { AdminFlash, pick } from '@/components/admin-flash'
import { ConfirmSubmit } from '@/components/confirm-submit'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

export default async function AdminNotificationsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  await requireAdmin()
  const sp = await searchParams

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <AdminFlash ok={pick(sp.ok)} error={pick(sp.error)} />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Send an announcement to everyone</CardTitle>
          <CardDescription>
            Every user gets it in their notification bell. Users who have the app open also hear a sound and see a popup.
            New jobs, new applicants and approvals are sent automatically.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={broadcast} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" name="title" required maxLength={120} placeholder="For example: New feature!" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="body">Message (optional)</Label>
              <Textarea id="body" name="body" rows={4} maxLength={400} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="link">Link when tapped (optional)</Label>
              <Input id="link" name="link" maxLength={300} placeholder="/jobs  or  https://..." />
            </div>
            <div>
              <ConfirmSubmit message="Send this to ALL users now?">Send to everyone</ConfirmSubmit>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
