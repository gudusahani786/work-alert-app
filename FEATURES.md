# WorkAlert: features in detail

## 1. One account for everything
- There is only one account type. The same person can find jobs, apply to jobs (not their own) and post jobs to hire people.
- Sign up with: Google, Email + Password, or Email code (no password, a code arrives in the email).
- Sign-up form: Name, Phone, Gender, Email, Password, Repeat password. Name, phone and gender are saved to the profile automatically.
- Login with Google, password or email code. Sign out from the avatar menu or Settings.
- Clear error messages with an error code (already registered, weak password, email could not be sent, too many attempts, etc.).

## 2. Privacy (logged-out visitors)
- Logged-out visitors see only the home banner with Login / Create account.
- Job list, job details and applications are locked in the app AND in the database (Row Level Security).

## 3. Navigation
- Home, Jobs, Applications, My Jobs, Messages, Profile, Settings.
- On phones the menu is a scrollable bar under the top bar; on desktop it is in the header.
- Avatar menu: Profile, Settings, Sign out.
- Friendly error page ("Something went wrong" with Try again / Go home) instead of a blank failure.

## 4. Finding a job (as a job seeker)
- Open jobs list with live updates (new, closed or deleted jobs change instantly).
- Search by title, company or location.
- Filters: Country → Region → City, Category, Job type.
- Pay shown per hour in Won AND Dollar (live exchange rate cached 6 hours; fallback 1 USD = 1,400 KRW).
- Job detail page with description, requirements, exact address.
- One-click Apply (name, email, phone, cover letter). Cannot apply twice. Cannot apply to your own job. Cannot apply to a closed job.

## 5. My Applications
- Shows ONLY your own applications (fixed: employers no longer see their applicants mixed in here).
- Status: Submitted → Under Review → Approved / Rejected, updated live.
- When Approved, a Chat button appears.

## 6. Hiring (as an employer)
- My Jobs dashboard: each job with applicant count and "new" count (live).
- Post a job: title, company, Country → Region → City + address, hourly pay min/max in KRW or USD, job type, category, description, requirements.
- Close / reopen / delete a job.
- Applicants page: name, email, phone, skills, experience, education, location, expected pay, cover letter, resume (PDF, secure link).
- Actions: Under Review, Approve, Reject. Approve opens the chat room.

## 7. Profile and Settings
- Profile page (read view) and full edit form in Settings.
- Photo (JPG/PNG/WebP, max 2 MB), PDF resume (max 5 MB), headline, skills, languages, experience, education, desired hourly rate (KRW/USD), portfolio link, about, gender, location, company details.
- Photo and resume upload work even if the profile row was missing (fixed).
- Change email, change password, language, Developer (GUDUTECH), Help / FAQ.

## 8. Chat and calls
- A chat room opens only when an application is Approved. If the application is later Rejected, the chat locks.
- Realtime messages, read receipts (single / double tick), unread counters in the list.
- Voice and video call buttons (Jitsi link posted in the chat). The other person gets a popup with a Join button on any page.
- Chat height fixed for phones (message box no longer pushed off screen).

## 9. Languages
- English, 한국어 (Korean), नेपाली (Nepali). Globe icon in the header or Settings. All screens are translated.

## 10. Security
- Row Level Security on every table.
- Only the employer of a job can read its applications; only the applicant and that employer can read the resume.
- Chat only between the two people of an approved application.
- Rate limits: messages, applications, jobs per minute / hour.
- Server-side validation: email, phone, URL, location, job fields.
- Sign-up trigger can never block sign-up (it logs a warning and continues).

## 11. Tech
Next.js + React, Supabase (Auth, Postgres, Realtime, Storage), Tailwind, base-ui components.

## 12. Forgot password
- "Forgot password?" on the login page. Enter your email, receive a code, enter the code and a new password. Works on any device.

## 13. Notifications and sounds
- Bell with unread count and a Notifications page (mark all read, clear, tap to open).
- Automatic notifications: new job (everyone), new applicant (employer), approved / under review / rejected (applicant), new report and new support message (admins), support reply (user).
- Admin announcements to everyone.
- Sounds made in the browser: message ding, notification chime, phone-like ringing for incoming calls (30 s, Join button).
- Settings: sound on/off, background alerts on/off, test sound.

## 14. Admin panel (/admin)
- Overview statistics and 7-day chart.
- Users: search, edit, ban / unban, make admin, delete.
- Jobs: search, edit any job, close / reopen, delete.
- Reports: users report a job; admin resolves, dismisses, closes or deletes.
- Notifications: announcement to all users.
- Support: reply to users' messages.
- Settings: developer photo / name / about, support contacts, announcement banner.
- Banned users cannot post jobs, apply or send messages and see a red notice.
- Only admins can open it, and the database blocks everybody else (not only the screen).

## 15. Help & support and Developer pages
- /help: contact buttons, send a message to the admin, see replies, FAQ.
- /developer: photo, name and about me (edited by the admin).

## 16. Edit jobs
- Owners can edit their jobs (Edit button in My Jobs). Admins can edit any job.
