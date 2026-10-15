-- =====================================================================
-- WorkAlert - ADMIN + NOTIFICATIONS UPDATE  (safe to run again)
-- Run this AFTER supabase-setup.sql (or after parts 1, 2, 3).
-- Supabase Dashboard > SQL Editor > New query > paste EVERYTHING > Run
--
-- Adds: admin role, ban system, notifications (new job / applicant / status),
--       reports, support tickets, site settings (developer page), admin tools.
-- If you ever run supabase-setup.sql again, run this file again after it.
-- =====================================================================

-- ---------- 1) NEW PROFILE COLUMNS ----------
alter table public.profiles add column if not exists is_admin boolean not null default false;
alter table public.profiles add column if not exists is_banned boolean not null default false;
alter table public.profiles add column if not exists banned_reason text;

-- ---------- 2) HELPER FUNCTIONS ----------
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = ''
as $$
  select coalesce((select p.is_admin from public.profiles p where p.id = auth.uid()), false)
$$;

create or replace function public.is_banned()
returns boolean language sql stable security definer set search_path = ''
as $$
  select coalesce((select p.is_banned from public.profiles p where p.id = auth.uid()), false)
$$;

grant execute on function public.is_admin() to anon, authenticated;
grant execute on function public.is_banned() to anon, authenticated;

-- Normal users can NEVER change is_admin / is_banned (not even on their own profile).
-- (Changes made in the SQL Editor have no logged-in user, so they are allowed: that is how you create the first admin.)
create or replace function public.protect_profile_privileges()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    if tg_op = 'INSERT' then
      new.is_admin := false;
      new.is_banned := false;
      new.banned_reason := null;
    else
      new.is_admin := old.is_admin;
      new.is_banned := old.is_banned;
      new.banned_reason := old.banned_reason;
    end if;
  end if;
  return new;
end $$;

drop trigger if exists protect_profile_privileges on public.profiles;
create trigger protect_profile_privileges before insert or update on public.profiles
  for each row execute function public.protect_profile_privileges();

-- ---------- 3) NOTIFICATIONS ----------
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null default 'info',
  title text not null,
  body text,
  link text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists notifications_user_idx on public.notifications (user_id, created_at desc);

alter table public.notifications enable row level security;
drop policy if exists "notifications_select_own" on public.notifications;
drop policy if exists "notifications_update_own" on public.notifications;
drop policy if exists "notifications_delete_own" on public.notifications;
drop policy if exists "notifications_admin_all" on public.notifications;
create policy "notifications_select_own" on public.notifications for select to authenticated using (user_id = auth.uid());
create policy "notifications_update_own" on public.notifications for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "notifications_delete_own" on public.notifications for delete to authenticated using (user_id = auth.uid());
create policy "notifications_admin_all" on public.notifications for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create or replace function public.notify(p_user uuid, p_type text, p_title text, p_body text, p_link text)
returns void language sql security definer set search_path = ''
as $$
  insert into public.notifications (user_id, type, title, body, link)
  values (p_user, p_type, left(p_title, 300), left(p_body, 600), left(p_link, 300));
$$;
revoke all on function public.notify(uuid, text, text, text, text) from public, anon, authenticated;

-- 3a) New job -> everybody (except the poster and banned users) gets a notification
create or replace function public.trg_notify_new_job()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  begin
    if new.status = 'open' then
      insert into public.notifications (user_id, type, title, body, link)
      select p.id, 'job', left(new.title, 300),
             left(new.company || ' - ' || coalesce(new.location, ''), 600),
             '/jobs/' || new.id
      from public.profiles p
      where p.id is distinct from new.employer_id and not p.is_banned;
    end if;
  exception when others then
    raise warning 'trg_notify_new_job failed: % (%)', sqlerrm, sqlstate;
  end;
  return new;
end $$;
drop trigger if exists notify_new_job on public.jobs;
create trigger notify_new_job after insert on public.jobs
  for each row execute function public.trg_notify_new_job();

-- 3b) New applicant -> the employer
create or replace function public.trg_notify_new_application()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare v_emp uuid; v_title text;
begin
  begin
    select employer_id, title into v_emp, v_title from public.jobs where id = new.job_id;
    if v_emp is not null then
      perform public.notify(v_emp, 'applicant', v_title, new.full_name, '/employer/jobs/' || new.job_id);
    end if;
  exception when others then
    raise warning 'trg_notify_new_application failed: % (%)', sqlerrm, sqlstate;
  end;
  return new;
end $$;
drop trigger if exists notify_new_application on public.applications;
create trigger notify_new_application after insert on public.applications
  for each row execute function public.trg_notify_new_application();

-- 3c) Application status changed -> the applicant
create or replace function public.trg_notify_application_status()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare v_title text;
begin
  begin
    if new.status is distinct from old.status then
      select title into v_title from public.jobs where id = new.job_id;
      perform public.notify(new.user_id, 'status', coalesce(v_title, ''), new.status,
                            case when new.status = 'Approved' then '/chat' else '/dashboard' end);
    end if;
  exception when others then
    raise warning 'trg_notify_application_status failed: % (%)', sqlerrm, sqlstate;
  end;
  return new;
end $$;
drop trigger if exists notify_application_status on public.applications;
create trigger notify_application_status after update on public.applications
  for each row execute function public.trg_notify_application_status();

-- 3d) Admin sends an announcement to everybody
create or replace function public.admin_broadcast(p_title text, p_body text, p_link text)
returns integer language plpgsql security definer set search_path = ''
as $$
declare v_count integer;
begin
  if not public.is_admin() then raise exception 'not allowed'; end if;
  if p_title is null or btrim(p_title) = '' then raise exception 'title required'; end if;
  insert into public.notifications (user_id, type, title, body, link)
  select p.id, 'announcement', left(btrim(p_title), 300), left(nullif(btrim(coalesce(p_body, '')), ''), 600),
         left(nullif(btrim(coalesce(p_link, '')), ''), 300)
  from public.profiles p;
  get diagnostics v_count = row_count;
  return v_count;
end $$;
revoke all on function public.admin_broadcast(text, text, text) from public, anon;
grant execute on function public.admin_broadcast(text, text, text) to authenticated;

-- ---------- 4) REPORTS (users report a job or a user) ----------
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  target_type text not null check (target_type in ('job', 'user')),
  target_id uuid not null,
  target_label text,
  reason text not null check (char_length(reason) between 1 and 100),
  details text check (details is null or char_length(details) <= 2000),
  status text not null default 'open' check (status in ('open', 'resolved', 'dismissed')),
  admin_note text,
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  unique (reporter_id, target_type, target_id)
);
create index if not exists reports_status_idx on public.reports (status, created_at desc);

alter table public.reports enable row level security;
drop policy if exists "reports_insert_own" on public.reports;
drop policy if exists "reports_select_own" on public.reports;
drop policy if exists "reports_admin_all" on public.reports;
create policy "reports_insert_own" on public.reports for insert to authenticated
  with check (reporter_id = auth.uid() and status = 'open' and not public.is_banned());
create policy "reports_select_own" on public.reports for select to authenticated using (reporter_id = auth.uid());
create policy "reports_admin_all" on public.reports for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create or replace function public.trg_notify_report()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  begin
    insert into public.notifications (user_id, type, title, body, link)
    select p.id, 'report', left(coalesce(new.target_label, ''), 300), left(new.reason, 600), '/admin/reports'
    from public.profiles p where p.is_admin;
  exception when others then
    raise warning 'trg_notify_report failed: % (%)', sqlerrm, sqlstate;
  end;
  return new;
end $$;
drop trigger if exists notify_report on public.reports;
create trigger notify_report after insert on public.reports
  for each row execute function public.trg_notify_report();

-- ---------- 5) SUPPORT TICKETS (Help & Support: users write to the admin) ----------
create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text,
  email text,
  subject text not null check (char_length(subject) between 1 and 200),
  message text not null check (char_length(message) between 1 and 3000),
  status text not null default 'open' check (status in ('open', 'answered', 'closed')),
  admin_reply text,
  replied_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists support_tickets_status_idx on public.support_tickets (status, created_at desc);

alter table public.support_tickets enable row level security;
drop policy if exists "tickets_insert_own" on public.support_tickets;
drop policy if exists "tickets_select_own" on public.support_tickets;
drop policy if exists "tickets_admin_all" on public.support_tickets;
create policy "tickets_insert_own" on public.support_tickets for insert to authenticated
  with check (user_id = auth.uid() and status = 'open' and admin_reply is null);
create policy "tickets_select_own" on public.support_tickets for select to authenticated using (user_id = auth.uid());
create policy "tickets_admin_all" on public.support_tickets for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- New ticket -> admins; admin reply -> the user
create or replace function public.trg_notify_ticket()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  begin
    if tg_op = 'INSERT' then
      insert into public.notifications (user_id, type, title, body, link)
      select p.id, 'support', left(new.subject, 300), left(coalesce(new.name, new.email, ''), 600), '/admin/support'
      from public.profiles p where p.is_admin;
    elsif new.admin_reply is not null and new.admin_reply is distinct from old.admin_reply then
      perform public.notify(new.user_id, 'support_reply', new.subject, left(new.admin_reply, 300), '/help');
    end if;
  exception when others then
    raise warning 'trg_notify_ticket failed: % (%)', sqlerrm, sqlstate;
  end;
  return new;
end $$;
drop trigger if exists notify_ticket on public.support_tickets;
create trigger notify_ticket after insert or update on public.support_tickets
  for each row execute function public.trg_notify_ticket();

-- ---------- 6) SITE SETTINGS (developer page, announcement banner, contact) ----------
create table if not exists public.app_settings (
  key text primary key,
  value text not null default '',
  updated_at timestamptz not null default now()
);
alter table public.app_settings enable row level security;
drop policy if exists "settings_read_all" on public.app_settings;
drop policy if exists "settings_admin_write" on public.app_settings;
create policy "settings_read_all" on public.app_settings for select to anon, authenticated using (true);
create policy "settings_admin_write" on public.app_settings for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

insert into public.app_settings (key, value) values
  ('dev_name', 'GUDUTECH'),
  ('dev_title', 'Developer'),
  ('dev_about', ''),
  ('dev_photo_url', ''),
  ('support_email', ''),
  ('support_phone', ''),
  ('support_whatsapp', ''),
  ('announcement', '')
on conflict (key) do nothing;

-- ---------- 7) ADMIN POWERS ON EXISTING TABLES (admin can see/edit/delete everything) ----------
drop policy if exists "profiles_admin_all" on public.profiles;
drop policy if exists "jobs_admin_all" on public.jobs;
drop policy if exists "applications_admin_all" on public.applications;
drop policy if exists "conversations_admin_all" on public.conversations;
drop policy if exists "messages_admin_all" on public.messages;
create policy "profiles_admin_all" on public.profiles for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "jobs_admin_all" on public.jobs for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "applications_admin_all" on public.applications for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "conversations_admin_all" on public.conversations for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "messages_admin_all" on public.messages for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ---------- 8) BAN SYSTEM: banned users cannot post, apply or message ----------
drop policy if exists "jobs_insert_employer" on public.jobs;
create policy "jobs_insert_employer" on public.jobs for insert
  with check (employer_id = auth.uid() and not public.is_banned());

drop policy if exists "applications_insert_own" on public.applications;
create policy "applications_insert_own" on public.applications for insert with check (
  user_id = auth.uid() and status = 'Submitted' and not public.is_banned()
  and exists (select 1 from public.jobs jb
              where jb.id = applications.job_id and jb.status = 'open'
                and (jb.employer_id is null or jb.employer_id <> auth.uid())));

drop policy if exists "messages_insert_approved" on public.messages;
create policy "messages_insert_approved" on public.messages for insert with check (
  sender_id = auth.uid() and read_at is null and not public.is_banned()
  and exists (select 1 from public.conversations cv
              join public.applications ap on ap.id = cv.application_id
              where cv.id = messages.conversation_id
                and ap.status = 'Approved'
                and auth.uid() in (cv.seeker_id, cv.employer_id)));

-- ---------- 9) ADMIN FUNCTIONS ----------
create or replace function public.admin_delete_user(p_user uuid)
returns void language plpgsql security definer set search_path = ''
as $$
begin
  if not public.is_admin() then raise exception 'not allowed'; end if;
  if p_user = auth.uid() then raise exception 'you cannot delete yourself'; end if;
  delete from auth.users where id = p_user;
end $$;
revoke all on function public.admin_delete_user(uuid) from public, anon;
grant execute on function public.admin_delete_user(uuid) to authenticated;

create or replace function public.admin_stats()
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare r jsonb;
begin
  if not public.is_admin() then raise exception 'not allowed'; end if;
  select jsonb_build_object(
    'users', (select count(*) from public.profiles),
    'banned', (select count(*) from public.profiles where is_banned),
    'admins', (select count(*) from public.profiles where is_admin),
    'jobs_open', (select count(*) from public.jobs where status = 'open'),
    'jobs_closed', (select count(*) from public.jobs where status = 'closed'),
    'applications', (select count(*) from public.applications),
    'app_submitted', (select count(*) from public.applications where status = 'Submitted'),
    'app_review', (select count(*) from public.applications where status = 'Under Review'),
    'app_approved', (select count(*) from public.applications where status = 'Approved'),
    'app_rejected', (select count(*) from public.applications where status = 'Rejected'),
    'conversations', (select count(*) from public.conversations),
    'messages', (select count(*) from public.messages),
    'reports_open', (select count(*) from public.reports where status = 'open'),
    'tickets_open', (select count(*) from public.support_tickets where status = 'open'),
    'new_users_7d', (select count(*) from public.profiles where created_at > now() - interval '7 days'),
    'new_jobs_7d', (select count(*) from public.jobs where created_at > now() - interval '7 days'),
    'daily', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'day', to_char(d.day, 'MM-DD'),
        'users', (select count(*) from public.profiles x where x.created_at::date = d.day),
        'jobs', (select count(*) from public.jobs x where x.created_at::date = d.day),
        'applications', (select count(*) from public.applications x where x.created_at::date = d.day)
      ) order by d.day), '[]'::jsonb)
      from (select (current_date - g)::date as day from generate_series(6, 0, -1) g) d
    )
  ) into r;
  return r;
end $$;
revoke all on function public.admin_stats() from public, anon;
grant execute on function public.admin_stats() to authenticated;

-- ---------- 10) REALTIME (live notification bell) ----------
do $$
declare t text;
begin
  foreach t in array array['notifications', 'support_tickets'] loop
    begin
      execute format('alter publication supabase_realtime add table public.%I', t);
    exception when duplicate_object then null;
    end;
  end loop;
end $$;

-- ---------- 11) MAKE YOURSELF THE FIRST ADMIN ----------
-- 1) Sign up in the app with your own email first.
-- 2) Then run this line in a NEW query (put your real email, keep the quotes):
--
--    update public.profiles set is_admin = true where email = 'YOUR-EMAIL@gmail.com';
--
-- To check: select email, is_admin from public.profiles where is_admin;
