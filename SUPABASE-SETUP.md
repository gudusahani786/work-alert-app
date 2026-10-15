# WorkAlert: Supabase setup from A to Z

Follow the steps in order. Do not skip any. Total time: about 20 minutes.

Menu names in Supabase sometimes move a little. If you cannot find a menu, use the search box at the top of the dashboard.

---

## A. Create the Supabase project

1. Go to https://supabase.com/dashboard and log in (or sign up).
2. Click **New project**.
3. Fill in:
   - **Name**: `workalert`
   - **Database password**: click *Generate* and **save it** somewhere safe.
   - **Region**: choose the one closest to your users (for Korea: *Northeast Asia (Seoul)*).
4. Click **Create new project** and wait 1 to 2 minutes until it says the project is ready.

## B. Create all tables, security and storage (one script)

1. Left menu: **SQL Editor** → **New query**.
2. Open the file `supabase-setup.sql` from this project, **copy everything**, paste it into the editor.
3. Click **Run**.
4. You must see **Success. No rows returned.** (a few "notice" lines are fine).

This one script creates: profiles, jobs, applications, conversations, messages, security rules (RLS), chat functions, realtime, the `avatars` and `resumes` storage buckets, the sign-up trigger, and 6 sample jobs.

It is safe to run again at any time. Running it again will NOT delete your data.

If you see a red error: copy the full message and send it to me. Do not continue until it succeeds.

### Check that it worked
Run `supabase-diagnose.sql` the same way (SQL Editor → New query → paste → Run). You should see:
- Result 1: only ONE trigger on `auth.users` named `on_auth_user_created`. If you see another one (an old leftover that can break sign-up), remove it in a new query: `drop trigger "THE_NAME" on auth.users;` (put the real name in place of THE_NAME), then run the diagnose again.
- Result 2: 5 tables.
- Result 3: `rowsecurity = true` for all 5.
- Result 4: `missing_profiles = 0`.
- Result 5: buckets `avatars` (public) and `resumes` (not public).
- Result 6: jobs, applications, conversations, messages.

## C. Get your two keys

1. Left menu: **Project Settings** (gear icon) → **API** (it may be called **API Keys**).
2. Copy:
   - **Project URL** → looks like `https://abcdxyz.supabase.co`
   - **anon public** key (a long `eyJ...` text). Newer projects may show a **Publishable key** (`sb_publishable_...`). Either one works.
3. **NEVER** use the `service_role` / `secret` key in this app.

## D. Put the keys in the app

### On your computer
1. In the project folder, copy `.env.local.example` to a new file named `.env.local`.
2. Fill it:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT-REF.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR-ANON-OR-PUBLISHABLE-KEY
   ```
3. Save the file (Ctrl+S). No spaces, no quotes.
4. Run:
   ```
   npm install --legacy-peer-deps
   npm run dev
   ```
   Open http://localhost:3000

### On Vercel (your live website)
1. Vercel → your project → **Settings** → **Environment Variables**.
2. Add the same two variables (names must be exactly the same). Tick Production, Preview and Development.
3. Go to **Deployments** → the latest one → **⋯** → **Redeploy**.
   Environment variables only work after a new deploy.

> If a page shows "This page couldn't load" on Vercel, the most common reason is that these two variables are missing or the redeploy was not done.

## E. Tell Supabase your website address

1. **Authentication** → **URL Configuration**.
2. **Site URL**: your live address, e.g. `https://your-app.vercel.app` (for local testing only: `http://localhost:3000`).
3. **Redirect URLs** → Add these (one per line):
   ```
   http://localhost:3000/**
   https://your-app.vercel.app/**
   ```
4. Click **Save**.

## F. Email + password login (sign up with password)

1. **Authentication** → **Sign In / Providers** (may be called **Providers**) → **Email**.
2. Turn **Enable Email provider** ON.
3. **Confirm email**: turn it **OFF** to start (easiest, and it avoids the sign-up error described below).
4. Minimum password length: 6.
5. Save.

> **Why this matters:** If "Confirm email" is ON, Supabase must send an email at every sign-up. Supabase's built-in email sender only works for a few emails per hour and only for people in your own team. Any other person gets "Unable to complete sign-up". Fix = turn Confirm email OFF, or set up your own SMTP in step G.

## G. Email code login (OTP) and your own email sender (SMTP)

Only needed if you want the "Email code" tab to work for everybody.

### G1. Change the email templates so they show a code
1. **Authentication** → **Emails** (or **Email Templates**).
2. Open **Magic Link** and put this in the message body:
   ```
   <h2>Your WorkAlert login code</h2>
   <p>Your login code is: <b>{{ .Token }}</b></p>
   ```
3. Do the same for **Confirm signup**.
4. Save each one.

### G2. Set up SMTP (so emails go to any address)
1. **Authentication** → **Emails** → **SMTP Settings** → turn on **Enable custom SMTP**.
2. Using Gmail:
   - Google Account → **Security** → turn **2-Step Verification** ON.
   - Search "App passwords" → create one (name: `workalert`) → copy the 16-letter password.
   - In Supabase fill:
     - Sender email: your Gmail
     - Sender name: `WorkAlert`
     - Host: `smtp.gmail.com`
     - Port: `465`
     - Username: your Gmail
     - Password: the 16-letter App password
3. Save. (Gmail has a daily sending limit. For a bigger app use Resend, Brevo or SendGrid with the same fields.)

## H. Google login

### H1. Google Cloud
1. Go to https://console.cloud.google.com and create a project (or pick one).
2. **APIs & Services** → **OAuth consent screen**:
   - User type: **External**. App name: `WorkAlert`. Add your support email.
   - At the end click **Publish app** (so every Gmail can log in; in *Testing* mode only the test users you add can).
3. **APIs & Services** → **Credentials** → **Create credentials** → **OAuth client ID**:
   - Application type: **Web application**
   - **Authorized redirect URIs** → add exactly:
     `https://YOUR-PROJECT-REF.supabase.co/auth/v1/callback`
   - Click **Create** and copy the **Client ID** and **Client secret**.

### H2. Supabase
1. **Authentication** → **Sign In / Providers** → **Google** → turn ON.
2. Paste Client ID and Client secret → **Save**.

> `YOUR-PROJECT-REF` is the part before `.supabase.co` in your Project URL.

## I. Storage (profile photo + resume)

The script already created the two buckets. Check: left menu **Storage**:
- `avatars` → Public
- `resumes` → Private (only the owner and the employers of jobs they applied to can open a resume)

Nothing else to do.

## J. Realtime (live updates and chat)

The script already switched it on. Check: **Database** → **Publications** → `supabase_realtime` → tables `jobs`, `applications`, `conversations`, `messages` must be ticked.

If any is missing, run `supabase-setup.sql` again.

## K. Full test, A to Z

Use two browsers (one normal, one incognito).

1. Browser 1: **Create account** (Name, Phone, Gender, Email, Password) → you land on Home.
2. **Settings** → fill profile, upload photo and a PDF resume → **Save**.
3. **My Jobs** → **Post a job** (choose Country → Region → City, hourly pay in KRW or USD).
4. Browser 2: **Create account** with another email → **Jobs** → open the job → **Apply**.
5. Browser 1 → **My Jobs** → open the job → the applicant appears at once → **Approve**.
6. Browser 2 → **Applications** → status changes to **Approved** live → **Chat**.
7. Send messages from both sides. Try **Call** / **Video** (opens a Jitsi room).
8. Switch language (globe icon): English / 한국어 / नेपाली.
9. Settings → change password → Sign out → Log in again.

## L. Admin panel, notifications, reports and support (second SQL file)

Do this AFTER step B.

1. SQL Editor → **New query** → paste ALL of `supabase-admin-update.sql` → **Run**. You must see **Success**.
2. Sign up (or log in) in your app with **your own** email.
3. New query, run this one line (put your real email between the quotes):
   ```
   update public.profiles set is_admin = true where email = 'YOUR-EMAIL@gmail.com';
   ```
4. Log out and log in again. You now see **Admin** in the menu (and "Admin panel" in the avatar menu).

If you ever run `supabase-setup.sql` again, run `supabase-admin-update.sql` again after it.

What the admin panel does (`/admin`):
- **Overview**: users, jobs, applications, chats, open reports, open support messages and a 7-day chart.
- **Users**: search, edit, ban / unban, make admin, delete a user with all their data.
- **Jobs**: search, edit any job, close / reopen, delete.
- **Reports**: jobs reported by users. Resolve, dismiss, close or delete the job.
- **Notifications**: send an announcement to every user (bell + popup + sound).
- **Support**: read and answer messages from the Help & support page.
- **Settings**: your developer photo, name and "About me", support email / phone / WhatsApp, and a banner shown at the top of every page.

## M. Forgot password (email code)

The "Forgot password?" link on the login page emails a code. For the code to show in the email, change the template:

1. **Authentication** → **Emails** (or **Email Templates**) → **Reset Password**.
2. Put this in the message body:
   ```
   <h2>Reset your WorkAlert password</h2>
   <p>Your code is: <b>{{ .Token }}</b></p>
   ```
3. **Save**.

Emails need working email sending (step F/G). Without your own SMTP, Supabase only sends a few emails per hour.

## N. Notifications and sounds

Nothing to set up in Supabase (the SQL in step L did it). In the app: **Settings → Notifications & sounds**.
- New job, new applicant, approved / rejected and announcements show in the bell and as a popup with a sound.
- New chat messages play a sound. Incoming calls ring (Join button) until answered or 30 seconds.
- Sounds start after the person taps the page once (browser rule).
- These work while the website is open (even in a background tab). Alerts when the browser/app is fully closed need "push notifications", which is a separate upgrade.

---

## Troubleshooting

The sign-up screen now shows an **Error code** under the red message. Use this table.

| What you see | Meaning | Fix |
|---|---|---|
| `unexpected_failure` + "could not send the confirmation email" | Confirm email is ON but email sending is not set up | Step F (turn Confirm email OFF) or Step G2 (SMTP) |
| `unexpected_failure` + "server problem" | Database trigger crashed | Run `supabase-setup.sql` again (new fail-safe trigger), then `supabase-diagnose.sql` |
| `email_address_not_authorized` | Built-in sender only emails your team | Step G2 (SMTP) |
| `over_email_send_rate_limit` | Too many emails sent | Wait 1 hour, or Step G2 |
| `user_already_exists` / "already registered" | Email is used | Log in instead |
| `signup_disabled` | Sign-ups are off | **Authentication** → **Sign In / Providers** → turn ON "Allow new users to sign up" |
| `weak_password` | Password too short | Use 6+ characters |
| Google: `redirect_uri_mismatch` | Wrong redirect URI in Google Cloud | Step H1 (exact Supabase callback URL) |
| Google: "access blocked" | Consent screen in Testing | Publish the app (Step H1) or add yourself as a Test user |
| After login, back to login page | Site URL / Redirect URL wrong | Step E |
| "This page couldn't load" | Keys missing on Vercel, or SQL not run | Steps B and D, then Redeploy |
| Profile photo will not upload | Bucket missing | Run `supabase-setup.sql` again, check Step I |
| Chat does not update live | Realtime off | Step J |
| "Admin" menu missing | Your profile is not admin yet | Step L point 3, then log out and in |
| Admin overview says "statistics could not be loaded" | `supabase-admin-update.sql` not run | Step L point 1 |
| Forgot-password email has no code | Template still has the link | Step M |
| No sound on a new message | Browser blocks sound until the first tap | Tap the page once; check Settings → Notifications & sounds |

### Where to see the real error
- Supabase → **Logs** → **Auth** (sign-up/login problems) and **Postgres** (database problems).
- Vercel → your project → **Logs** (website problems).
- Browser: open the page → right-click → Inspect → **Console**.

## Safety rules
- Only the **anon / publishable** key goes in the app. Never the `service_role` or `secret` key.
- Never upload `.env.local` to GitHub (it is already in `.gitignore`).
- Every table has Row Level Security. Do not turn it off.
