import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Toaster } from '@/components/ui/sonner'
import { GlobalNotifier } from '@/components/global-notifier'
import { AnnouncementBanner } from '@/components/announcement-banner'
import { I18nProvider } from '@/lib/i18n/client'
import { getLocale } from '@/lib/i18n/server'
import './globals.css'

export const metadata: Metadata = {
  title: 'WorkAlert — Find & Apply for Jobs',
  description:
    'WorkAlert is a job board where you can browse work opportunities, create your profile, and apply to jobs in real time.',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' },
  ],
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const locale = await getLocale()
  return (
    <html lang={locale}>
      <body className="antialiased">
        <I18nProvider locale={locale}>
          <AnnouncementBanner />
          {children}
          <GlobalNotifier />
        </I18nProvider>
        <Toaster position="top-center" richColors />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
