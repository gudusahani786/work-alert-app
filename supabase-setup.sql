-- =====================================================================
-- WorkAlert - COMPLETE Supabase setup  (safe to run again and again)
-- Supabase Dashboard > SQL Editor > New query > paste EVERYTHING > Run
-- It creates / upgrades: tables, security rules (RLS), chat, realtime,
-- file storage (photo + resume), sign-up trigger and sample jobs.
-- If an older database exists, it is upgraded without deleting your data.
-- =====================================================================

-- ---------- 1) TABLES ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text, email text, phone text, location text, headline text,
  bio text, skills text, experience_years int, education text, current_company text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles add column if not exists role text not null default 'seeker';
alter table public.profiles add column if not exists company_name text;
alter table public.profiles add column if not exists website text;
alter table public.profiles add column if not exists company_description text;
alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists resume_url text;
alter table public.profiles add column if not exists country text;
alter table public.profiles add column if not exists region text;
alter table public.profiles add column if not exists city text;
alter table public.profiles add column if not exists address text;
alter table public.profiles add column if not exists languages text;
alter table public.profiles add column if not exists desired_hourly_rate numeric(12,2);
alter table public.profiles add column if not exists desired_currency text not null default 'KRW';
alter table public.profiles add column if not exists portfolio_url text;
alter table public.profiles add column if not exists gender text;
update public.profiles set gender = null where gender is not null and gender not in ('male','female','other','prefer_not');
alter table public.profiles drop constraint if exists profiles_gender_check;
alter table public.profiles add constraint profiles_gender_check check (gender is null or gender in ('male','female','other','prefer_not'));
update public.profiles set desired_currency = 'KRW' where desired_currency is null or desired_currency not in ('KRW','USD');
alter table public.profiles drop constraint if exists profiles_desired_currency_check;
alter table public.profiles add constraint profiles_desired_currency_check check (desired_currency in ('KRW','USD'));
update public.profiles set role = 'seeker' where role is null or role not in ('seeker','employer');
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check check (role in ('seeker','employer'));

create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  title text not null, company text not null, location text not null,
  job_type text not null default 'Full-time', category text,
  salary_min int, salary_max int,
  description text not null, requirements text,
  created_at timestamptz not null default now()
);
alter table public.jobs add column if not exists employer_id uuid references auth.users(id) on delete cascade default auth.uid();
alter table public.jobs add column if not exists status text not null default 'open';
alter table public.jobs add column if not exists country text;
alter table public.jobs add column if not exists region text;
alter table public.jobs add column if not exists city text;
alter table public.jobs add column if not exists address text;
alter table public.jobs add column if not exists pay_currency text not null default 'KRW';
alter table public.jobs add column if not exists hourly_min numeric(12,2);
alter table public.jobs add column if not exists hourly_max numeric(12,2);
update public.jobs set pay_currency = 'KRW' where pay_currency is null or pay_currency not in ('KRW','USD');
alter table public.jobs drop constraint if exists jobs_pay_currency_check;
alter table public.jobs add constraint jobs_pay_currency_check check (pay_currency in ('KRW','USD'));
update public.jobs set status = 'open' where status is null or status not in ('open','closed');
alter table public.jobs drop constraint if exists jobs_status_check;
alter table public.jobs add constraint jobs_status_check check (status in ('open','closed'));

create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  full_name text not null, email text not null, phone text, cover_letter text,
  status text not null default 'Submitted',
  created_at timestamptz not null default now(),
  unique (job_id, user_id)
);
update public.applications set status = 'Submitted' where status not in ('Submitted','Under Review','Approved','Rejected');
alter table public.applications drop constraint if exists applications_status_check;
alter table public.applications add constraint applications_status_check
  check (status in ('Submitted','Under Review','Approved','Rejected'));
create index if not exists applications_user_idx on public.applications(user_id);
create index if not exists applications_job_idx on public.applications(job_id);
create index if not exists jobs_employer_idx on public.jobs(employer_id);
create index if not exists jobs_place_idx on public.jobs(country, region, city);

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null unique references public.applications(id) on delete cascade,
  seeker_id uuid not null references auth.users(id) on delete cascade,
  employer_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
create index if not exists conversations_seeker_idx on public.conversations(seeker_id);
create index if not exists conversations_employer_idx on public.conversations(employer_id);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  kind text not null default 'text' check (kind in ('text','call')),
  body text not null check (char_length(body) between 1 and 2000),
  read_at timestamptz,
  created_at timestamptz not null default now(),
  check (kind = 'text' or body in ('voice','video'))
);
create index if not exists messages_conv_idx on public.messages(conversation_id, created_at);

-- ---------- 2) HELPER FUNCTIONS ----------
create or replace function public.is_employer()
returns boolean language sql stable security definer set search_path = ''
as $$ select exists (select 1 from public.profiles where id = auth.uid() and role = 'employer') $$;

-- Employer changes the application status. "Approved" opens the chat room.
create or replace function public.set_application_status(p_application_id uuid, p_status text)
returns uuid language plpgsql security definer set search_path = ''
as $$
declare
  v_app public.applications;
  v_emp uuid;
  v_conv uuid;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  if p_status not in ('Under Review','Approved','Rejected') then raise exception 'invalid status'; end if;
  select * into v_app from public.applications where id = p_application_id;
  if not found then raise exception 'application not found'; end if;
  select employer_id into v_emp from public.jobs where id = v_app.job_id;
  if v_emp is distinct from auth.uid() then raise exception 'not allowed'; end if;

  update public.applications set status = p_status where id = p_application_id;

  if p_status = 'Approved' then
    insert into public.conversations (application_id, seeker_id, employer_id)
    values (p_application_id, v_app.user_id, v_emp)
    on conflict (application_id) do nothing;
    select id into v_conv from public.conversations where application_id = p_application_id;
    return v_conv;
  end if;
  return null;
end $$;

create or replace function public.mark_conversation_read(p_conversation_id uuid)
returns void language sql security definer set search_path = ''
as $$
  update public.messages ms set read_at = now()
  where ms.conversation_id = p_conversation_id
    and ms.sender_id <> auth.uid()
    and ms.read_at is null
    and exists (select 1 from public.conversations cv
                where cv.id = p_conversation_id and auth.uid() in (cv.seeker_id, cv.employer_id));
$$;

revoke all on function public.set_application_status(uuid, text) from public, anon;
revoke all on function public.mark_conversation_read(uuid) from public, anon;
grant execute on function public.set_application_status(uuid, text) to authenticated;
grant execute on function public.mark_conversation_read(uuid) to authenticated;

-- ---------- 3) RATE LIMITS (spam / abuse se bachav) ----------
create or replace function public.enforce_rate_limit()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare v_count int;
begin
  if tg_table_name = 'messages' then
    select count(*) into v_count from public.messages
      where sender_id = new.sender_id and created_at > now() - interval '1 minute';
    if v_count >= 60 then raise exception 'rate_limit: too many messages'; end if;
  elsif tg_table_name = 'applications' then
    select count(*) into v_count from public.applications
      where user_id = new.user_id and created_at > now() - interval '1 hour';
    if v_count >= 60 then raise exception 'rate_limit: too many applications'; end if;
  elsif tg_table_name = 'jobs' then
    select count(*) into v_count from public.jobs
      where employer_id = new.employer_id and created_at > now() - interval '1 hour';
    if v_count >= 50 then raise exception 'rate_limit: too many jobs'; end if;
  end if;
  return new;
end $$;

drop trigger if exists rl_messages on public.messages;
create trigger rl_messages before insert on public.messages for each row execute function public.enforce_rate_limit();
drop trigger if exists rl_applications on public.applications;
create trigger rl_applications before insert on public.applications for each row execute function public.enforce_rate_limit();
drop trigger if exists rl_jobs on public.jobs;
create trigger rl_jobs before insert on public.jobs for each row execute function public.enforce_rate_limit();

-- ---------- 4) ROW LEVEL SECURITY ----------
alter table public.profiles enable row level security;
alter table public.jobs enable row level security;
alter table public.applications enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;

-- profiles
drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
drop policy if exists "profiles_select_applicants" on public.profiles;
drop policy if exists "profiles_select_chat_partner" on public.profiles;
create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);
-- employer apne jobs ke applicants ka profile dekh sake
create policy "profiles_select_applicants" on public.profiles for select using (
  exists (select 1 from public.applications ap join public.jobs jb on jb.id = ap.job_id
          where ap.user_id = profiles.id and jb.employer_id = auth.uid()));
-- chat partner ka naam/photo dikhe
create policy "profiles_select_chat_partner" on public.profiles for select using (
  exists (select 1 from public.conversations cv
          where (cv.seeker_id = auth.uid() and cv.employer_id = profiles.id)
             or (cv.employer_id = auth.uid() and cv.seeker_id = profiles.id)));

-- jobs
drop policy if exists "jobs_public_read" on public.jobs;
drop policy if exists "jobs_insert_employer" on public.jobs;
drop policy if exists "jobs_update_owner" on public.jobs;
drop policy if exists "jobs_delete_owner" on public.jobs;
-- Jobs sirf login kiye hue users ko dikhte hain (bina login ke nahi)
create policy "jobs_public_read" on public.jobs for select to authenticated using (true);
-- Ek hi account type: har logged-in user job post kar sakta hai
create policy "jobs_insert_employer" on public.jobs for insert
  with check (employer_id = auth.uid());
create policy "jobs_update_owner" on public.jobs for update
  using (employer_id = auth.uid()) with check (employer_id = auth.uid());
create policy "jobs_delete_owner" on public.jobs for delete using (employer_id = auth.uid());

-- applications (update sirf set_application_status() function se)
drop policy if exists "applications_select_own" on public.applications;
drop policy if exists "applications_select_employer" on public.applications;
drop policy if exists "applications_insert_own" on public.applications;
create policy "applications_select_own" on public.applications for select using (auth.uid() = user_id);
create policy "applications_select_employer" on public.applications for select using (
  exists (select 1 from public.jobs jb where jb.id = applications.job_id and jb.employer_id = auth.uid()));
create policy "applications_insert_own" on public.applications for insert with check (
  user_id = auth.uid() and status = 'Submitted'
  and exists (select 1 from public.jobs jb
              where jb.id = applications.job_id and jb.status = 'open'
                and (jb.employer_id is null or jb.employer_id <> auth.uid())));

-- conversations (create sirf function se)
drop policy if exists "conversations_select_participants" on public.conversations;
create policy "conversations_select_participants" on public.conversations for select
  using (auth.uid() in (seeker_id, employer_id));

-- messages: padh sakte hain dono participants; likh sirf tab jab application Approved ho
drop policy if exists "messages_select_participants" on public.messages;
drop policy if exists "messages_insert_approved" on public.messages;
create policy "messages_select_participants" on public.messages for select using (
  exists (select 1 from public.conversations cv
          where cv.id = messages.conversation_id and auth.uid() in (cv.seeker_id, cv.employer_id)));
create policy "messages_insert_approved" on public.messages for insert with check (
  sender_id = auth.uid() and read_at is null
  and exists (select 1 from public.conversations cv
              join public.applications ap on ap.id = cv.application_id
              where cv.id = messages.conversation_id
                and ap.status = 'Approved'
                and auth.uid() in (cv.seeker_id, cv.employer_id)));

-- ---------- 5) SIGNUP TRIGGER (creates the profile; can NEVER block sign-up) ----------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare
  v_meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  v_avatar text := coalesce(v_meta->>'avatar_url', v_meta->>'picture');
  v_phone text := nullif(btrim(coalesce(v_meta->>'phone', '')), '');
  v_gender text := v_meta->>'gender';
begin
  begin
    insert into public.profiles (id, email, full_name, phone, gender, role, avatar_url)
    values (
      new.id, new.email,
      left(coalesce(v_meta->>'full_name', v_meta->>'name'), 200),
      case when v_phone ~ '^[0-9+() -]{6,20}$' then v_phone else null end,
      case when v_gender in ('male','female','other','prefer_not') then v_gender else null end,
      'seeker',
      case when v_avatar like 'https://%' then left(v_avatar, 500) else null end
    )
    on conflict (id) do nothing;
  exception when others then
    -- Never stop the sign-up because of a profile problem. The app re-creates the profile later.
    raise warning 'handle_new_user failed for %: % (%)', new.id, sqlerrm, sqlstate;
  end;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Profiles for users that already exist (older sign-ups)
insert into public.profiles (id, email)
select id, email from auth.users on conflict (id) do nothing;

-- ---------- 6) REALTIME ----------
do $$
declare t text;
begin
  foreach t in array array['jobs','applications','conversations','messages'] loop
    begin
      execute format('alter publication supabase_realtime add table public.%I', t);
    exception when duplicate_object then null;
    end;
  end loop;
end $$;

-- ---------- 7) STORAGE (profile photo + resume) ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('avatars', 'avatars', true, 2097152, array['image/jpeg','image/png','image/webp']),
  ('resumes', 'resumes', false, 5242880, array['application/pdf'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "avatars_read" on storage.objects;
drop policy if exists "avatars_write_own" on storage.objects;
drop policy if exists "avatars_update_own" on storage.objects;
drop policy if exists "avatars_delete_own" on storage.objects;
create policy "avatars_read" on storage.objects for select using (bucket_id = 'avatars');
create policy "avatars_write_own" on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "avatars_update_own" on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "avatars_delete_own" on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "resumes_read_own" on storage.objects;
drop policy if exists "resumes_read_employer" on storage.objects;
drop policy if exists "resumes_write_own" on storage.objects;
drop policy if exists "resumes_delete_own" on storage.objects;
create policy "resumes_read_own" on storage.objects for select to authenticated
  using (bucket_id = 'resumes' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "resumes_read_employer" on storage.objects for select to authenticated
  using (bucket_id = 'resumes' and exists (
    select 1 from public.applications ap join public.jobs jb on jb.id = ap.job_id
    where ap.user_id::text = (storage.foldername(name))[1] and jb.employer_id = auth.uid()));
create policy "resumes_write_own" on storage.objects for insert to authenticated
  with check (bucket_id = 'resumes' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "resumes_delete_own" on storage.objects for delete to authenticated
  using (bucket_id = 'resumes' and (storage.foldername(name))[1] = auth.uid()::text);

-- ---------- 8) SAMPLE JOBS (only when the jobs table is empty) ----------
insert into public.jobs
  (title, company, location, country, region, city, address, job_type, category,
   pay_currency, hourly_min, hourly_max, description, requirements, employer_id)
select * from (values
  ('Cafe Barista (Part-time)','Blue Bean Cafe','Mapo-gu, Seoul, South Korea','South Korea','Seoul','Mapo-gu','Near Hongik Univ. station','Part-time','Hospitality',
   'KRW',11000::numeric,13000::numeric,'Make coffee, serve customers and keep the cafe clean. Weekend shifts available.','Basic Korean, friendly attitude', null::uuid),
  ('English Tutor for Kids','Naju Kids Academy','Naju, Jeollanam-do, South Korea','South Korea','Jeollanam-do','Naju','Innovation City','Part-time','Education',
   'KRW',20000,30000,'Teach basic English to elementary students, 3 evenings a week.','Fluent English, patience with kids', null::uuid),
  ('Convenience Store Staff','Mart24','Haeundae-gu, Busan, South Korea','South Korea','Busan','Haeundae-gu',null,'Part-time','Retail',
   'KRW',10320,11500,'Cashier and stocking work, night shifts available.','Basic Korean', null::uuid),
  ('Frontend Developer Intern','TechNova Korea','Buk-gu, Gwangju, South Korea','South Korea','Gwangju','Buk-gu',null,'Internship','Engineering',
   'KRW',15000,20000,'Build web apps with React and Next.js with our team.','React basics, English or Korean', null::uuid),
  ('Warehouse Associate','FastLogis','Pyeongtaek, Gyeonggi-do, South Korea','South Korea','Gyeonggi-do','Pyeongtaek',null,'Part-time','Logistics',
   'KRW',12000,14000,'Pick, pack and load parcels in our fulfilment center.','Physical fitness, punctual', null::uuid),
  ('Remote Customer Support','HelpDesk Co','Remote','Remote',null,null,null,'Part-time','Support',
   'USD',8,12,'Answer customer chats and emails from home.','Good English, stable internet', null::uuid)
) as v(title,company,location,country,region,city,address,job_type,category,pay_currency,hourly_min,hourly_max,description,requirements,employer_id)
where not exists (select 1 from public.jobs);
