-- Expand allowed roles for the CRM team.
alter table app_users drop constraint if exists app_users_role_check;
alter table app_users add constraint app_users_role_check
  check (role in ('admin','manager','staff','viewer','customer'));

-- Caller's CRM role (SECURITY DEFINER → bypasses app_users RLS, no recursion).
create or replace function public.crm_role()
returns text language sql security definer set search_path = public stable
as $$ select role from app_users where id = auth.uid() $$;
grant execute on function public.crm_role() to authenticated, anon;

-- Products: catalog edits (admin/manager) vs stock updates (also staff).
drop policy if exists "admins insert products" on products;
drop policy if exists "admins update products" on products;
drop policy if exists "admins delete products" on products;
create policy "team insert products" on products for insert
  with check (crm_role() in ('admin','manager'));
create policy "team update products" on products for update
  using (crm_role() in ('admin','manager','staff'));
create policy "team delete products" on products for delete
  using (crm_role() in ('admin','manager'));

-- Orders: read (all team) + update status (admin/manager/staff).
drop policy if exists "admins read all orders" on orders;
drop policy if exists "admins update orders" on orders;
create policy "team read all orders" on orders for select
  using (crm_role() in ('admin','manager','staff','viewer'));
create policy "team update orders" on orders for update
  using (crm_role() in ('admin','manager','staff'))
  with check (crm_role() in ('admin','manager','staff'));

-- Collections + discounts: admin/manager.
drop policy if exists "admins manage collections" on collections;
create policy "team manage collections" on collections for all
  using (crm_role() in ('admin','manager')) with check (crm_role() in ('admin','manager'));
drop policy if exists "admins manage product_collections" on product_collections;
create policy "team manage product_collections" on product_collections for all
  using (crm_role() in ('admin','manager')) with check (crm_role() in ('admin','manager'));
drop policy if exists "admins manage discounts" on discounts;
create policy "team manage discounts" on discounts for all
  using (crm_role() in ('admin','manager')) with check (crm_role() in ('admin','manager'));

-- app_users: team can read all profiles; only admin can change roles.
drop policy if exists "admins read all profiles" on app_users;
create policy "team read all profiles" on app_users for select
  using (crm_role() in ('admin','manager','staff','viewer'));
create policy "admin update profiles" on app_users for update
  using (crm_role() = 'admin') with check (crm_role() = 'admin');
