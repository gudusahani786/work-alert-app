import Link from 'next/link'

// Public page (no login needed). Change CONTACT_EMAIL to your real email before you deploy.
const CONTACT_EMAIL = 'your-email@example.com'

export const metadata = { title: 'Terms of Service | WorkAlert' }

export default function TermsPage() {
  return (
    <main className="mx-auto w-full max-w-2xl space-y-6 px-4 py-10 text-sm leading-relaxed">
      <Link href="/" className="text-primary underline underline-offset-4">
        ← WorkAlert
      </Link>
      <h1 className="text-3xl font-bold">Terms of Service</h1>
      <p className="text-muted-foreground">Last updated: October 2026</p>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Using WorkAlert</h2>
        <p>
          WorkAlert is a platform where people can find jobs and post jobs. By creating an account you agree to give
          true information and to keep your password safe. You are responsible for what you post and send.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Rules</h2>
        <p>
          Do not post fake, illegal, or misleading jobs. Do not ask job seekers for money. Do not harass, spam or
          threaten other users. Do not try to break or misuse the service. We may remove content or close accounts that
          break these rules.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Jobs and hiring</h2>
        <p>
          WorkAlert only connects job seekers and employers. We are not the employer and we do not guarantee any job,
          pay, or the accuracy of any job post. Agreements about work are only between the employer and the worker.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">No warranty</h2>
        <p>
          The service is provided &quot;as is&quot;, without promises that it will always be available or error-free.
          We are not responsible for losses that come from using the service or from dealings between users.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Changes and contact</h2>
        <p>
          We may update these terms. Using the app after a change means you accept it. Questions:{' '}
          <a className="underline underline-offset-4" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>. See also our{' '}
          <Link href="/privacy" className="underline underline-offset-4">Privacy Policy</Link>.
        </p>
      </section>
    </main>
  )
}
