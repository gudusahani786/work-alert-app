-- =====================================================================
-- WorkAlert - DIAGNOSE (read-only, changes nothing)
-- Run this if sign-up fails. Look at each result tab.
-- =====================================================================

-- 1) Triggers on auth.users. You should see ONLY "on_auth_user_created".
--    Any other trigger that uses a public.* function can break sign-up.
select t.tgname as trigger_name, p.proname as function_name, n.nspname as function_schema, t.tgenabled as enabled
from pg_trigger t
join pg_class c on c.oid = t.tgrelid
join pg_namespace cn on cn.oid = c.relnamespace
join pg_proc p on p.oid = t.tgfoid
join pg_namespace n on n.oid = p.pronamespace
where cn.nspname = 'auth' and c.relname = 'users' and not t.tgisinternal;

-- 2) Are all tables there?  (expect 5 rows)
select table_name from information_schema.tables
where table_schema = 'public' and table_name in ('profiles','jobs','applications','conversations','messages')
order by table_name;

-- 3) Is Row Level Security ON for each table?  (rowsecurity must be true)
select tablename, rowsecurity from pg_tables
where schemaname = 'public' and tablename in ('profiles','jobs','applications','conversations','messages');

-- 4) Did every user get a profile?  (missing_profiles should be 0)
select
  (select count(*) from auth.users) as users,
  (select count(*) from public.profiles) as profiles,
  (select count(*) from auth.users u where not exists (select 1 from public.profiles p where p.id = u.id)) as missing_profiles;

-- 5) Storage buckets (expect avatars + resumes)
select id, public, file_size_limit from storage.buckets where id in ('avatars','resumes');

-- 6) Realtime tables (expect jobs, applications, conversations, messages)
select tablename from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' order by tablename;
