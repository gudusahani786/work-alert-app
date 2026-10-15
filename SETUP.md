# WorkAlert: quick start

The full step-by-step Supabase guide is in **SUPABASE-SETUP.md**. Short version:

1. Create a Supabase project.
2. SQL Editor → paste all of `supabase-setup.sql` → Run.
3. Copy `.env.local.example` to `.env.local` and fill the Project URL and anon key.
4. Authentication → Sign In / Providers → Email → **Confirm email OFF**.
5. `npm install --legacy-peer-deps` then `npm run dev` → http://localhost:3000
6. On Vercel: add the same two environment variables, then Redeploy.

Files:
- `supabase-setup.sql`: creates/upgrades the whole database (safe to run again).
- `supabase-admin-update.sql`: admin panel, notifications, reports, support (run after setup).
- `supabase-diagnose.sql`: read-only checks if something fails.
- `FEATURES.md`: everything the app does.

Adding a new city: edit `lib/locations.ts`. Adding a word/translation: edit `lib/i18n/dictionaries.ts` (English, Korean and Nepali must all get the same key).
