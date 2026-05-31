-- Populate app_users.full_name from auth metadata at signup time.
-- Covers both email signups (options.data.full_name) and OAuth providers
-- (Google/Apple typically expose 'full_name' or 'name'). Existing behaviour
-- is unchanged for users without a name in metadata.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.app_users (id, email, role, full_name)
  values (
    new.id,
    new.email,
    'customer',
    nullif(coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'), '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
