import Link from 'next/link'

// Public page (no login needed). Google requires a privacy policy link to publish the app.
// IMPORTANT: change CONTACT_EMAIL below to your real email before you deploy.
const CONTACT_EMAIL = 'your-email@example.com'

export const metadata = { title: 'Privacy Policy | WorkAlert' }

export default function PrivacyPage() {
  return (
    <main className="mx-auto w-full max-w-2xl space-y-6 px-4 py-10 text-sm leading-relaxed">
      <Link href="/" className="text-primary underline underline-offset-4">
        ← WorkAlert
      </Link>
      <h1 className="text-3xl font-bold">Privacy Policy</h1>
      <p className="text-muted-foreground">Last updated: October 2026</p>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">What we collect</h2>
        <p>
          When you create an account we collect your name, email address, phone number and gender. If you sign in with
          Google, we receive your name, email address and profile photo from Google. We never receive your Google
          password.
        </p>
        <p>
          If you fill in your profile we also store your photo, PDF resume, skills, experience, education, location,
          desired pay, and company details. If you apply for a job, we store your application. If you chat with an
          employer or a job seeker, we store the messages.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">How we use it</h2>
        <p>
          We use your information only to run WorkAlert: to log you in, show your profile to employers you apply to,
          let employers and job seekers contact each other after an application is approved, and show notifications.
          We do not sell your data and we do not show ads.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Who can see your data</h2>
        <p>
          Your resume and profile details are visible only to you and to employers whose jobs you applied to. Chat
          messages are visible only to the two people in the chat. Job posts are visible to logged-in users.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Services we use</h2>
        <p>
          Your data is stored with Supabase (database, login and file storage). Google is used for &quot;Sign in with
          Google&quot;. Voice and video calls open in a public Jitsi Meet room. The website is hosted on Vercel.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Your choices</h2>
        <p>
          You can edit your profile at any time in Settings. To delete your account and all of your data, email us at
          the address below and we will remove it.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Contact</h2>
        <p>
          Questions about privacy: <a className="underline underline-offset-4" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
        </p>
      </section>
    </main>
  )
}
