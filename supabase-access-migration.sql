-- Run this in Supabase SQL Editor
-- Goal:
-- 1) role model -> admin/user
-- 2) authenticated users can view records + evidence + gallery
-- 3) only admin can create records

begin;

update public.profiles
set role = 'user'
where role = 'member';

alter table public.profiles
  drop constraint if exists profiles_role_check;

alter table public.profiles
  add constraint profiles_role_check check (role in ('admin', 'user'));

alter table public.profiles
  alter column role set default 'user';

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
    'user'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop policy if exists records_select_public on public.violation_records;
drop policy if exists records_select_authenticated on public.violation_records;
create policy records_select_authenticated
on public.violation_records
for select
to authenticated
using (true);

drop policy if exists records_insert_self_reporter on public.violation_records;
drop policy if exists records_insert_admin_only on public.violation_records;
create policy records_insert_admin_only
on public.violation_records
for insert
to authenticated
with check (public.is_admin() and reporter_id = auth.uid());

drop policy if exists evidence_select_public on public.evidence_files;
drop policy if exists evidence_select_authenticated on public.evidence_files;
create policy evidence_select_authenticated
on public.evidence_files
for select
to authenticated
using (true);

drop policy if exists storage_evidence_select_public on storage.objects;
drop policy if exists storage_evidence_select_authenticated on storage.objects;
create policy storage_evidence_select_authenticated
on storage.objects
for select
to authenticated
using (bucket_id = 'evidence');

commit;

