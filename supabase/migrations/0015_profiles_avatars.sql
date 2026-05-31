alter table app_users add column if not exists full_name text;
alter table app_users add column if not exists avatar_url text;

insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true)
on conflict (id) do nothing;

drop policy if exists "avatars public read" on storage.objects;
create policy "avatars public read" on storage.objects for select
  using (bucket_id = 'avatars');

drop policy if exists "avatars owner insert" on storage.objects;
create policy "avatars owner insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "avatars owner update" on storage.objects;
create policy "avatars owner update" on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- Users may edit their OWN profile row (name/avatar) but NOT change their own role.
drop policy if exists "users update own profile" on app_users;
create policy "users update own profile" on app_users for update
  using (auth.uid() = id)
  with check (auth.uid() = id and role = (select role from app_users where id = auth.uid()));
