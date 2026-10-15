import type { AppNotification } from '@/lib/types'
import type { useI18n } from '@/lib/i18n/client'

type TFn = ReturnType<typeof useI18n>['t']

// Turns a notification row into readable text in the person's language.
// Admin announcements keep the exact text the admin wrote.
export function notifText(n: AppNotification, t: TFn): { title: string; body: string } {
  const title = n.title ?? ''
  const body = n.body ?? ''
  switch (n.type) {
    case 'job':
      return { title: t('notif.newJob', { title }), body }
    case 'applicant':
      return { title: t('notif.newApplicant', { title }), body }
    case 'status':
      if (body === 'Approved') return { title: t('notif.approved', { title }), body: '' }
      if (body === 'Rejected') return { title: t('notif.rejected', { title }), body: '' }
      return { title: t('notif.review', { title }), body: '' }
    case 'report':
      return { title: t('notif.report', { title }), body }
    case 'support':
      return { title: t('notif.support', { title }), body }
    case 'support_reply':
      return { title: t('notif.supportReply', { title }), body }
    default:
      return { title, body }
  }
}

