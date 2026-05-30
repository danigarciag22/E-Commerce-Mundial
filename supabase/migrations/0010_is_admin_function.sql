-- Fix: the inline `exists (select from app_users ...)` admin policies caused
-- infinite recursion once app_users itself had an admin SELECT policy (0007).
-- A SECURITY DEFINER is_admin() bypasses RLS on app_users → no recursion.

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (select 1 from app_users where id = auth.uid() and role = 'admin');
$$;

grant execute on function public.is_admin() to authenticated;
revoke execute on function public.is_admin() from anon, public;

-- Recreate every admin policy to use is_admin() instead of the recursive subquery.
drop policy if exists "admins read all profiles" on app_users;
create policy "admins read all profiles" on app_users for select using (public.is_admin());

drop policy if exists "admins read all orders" on orders;
create policy "admins read all orders" on orders for select using (public.is_admin());

drop policy if exists "admins insert products" on products;
drop policy if exists "admins update products" on products;
drop policy if exists "admins delete products" on products;
create policy "admins insert products" on products for insert with check (public.is_admin());
create policy "admins update products" on products for update using (public.is_admin());
create policy "admins delete products" on products for delete using (public.is_admin());

drop policy if exists "admins manage collections" on collections;
create policy "admins manage collections" on collections for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admins manage product_collections" on product_collections;
create policy "admins manage product_collections" on product_collections for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admins read discounts" on discounts;
drop policy if exists "admins manage discounts" on discounts;
create policy "admins manage discounts" on discounts for all using (public.is_admin()) with check (public.is_admin());
