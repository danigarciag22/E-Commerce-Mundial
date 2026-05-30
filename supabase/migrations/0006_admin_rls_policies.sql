-- Admins (app_users.role='admin') can read ALL orders for metrics/management.
create policy "admins read all orders" on orders for select
using (exists (select 1 from app_users where id = auth.uid() and role = 'admin'));

-- Admins can write the catalog directly (gated by their session + role).
create policy "admins insert products" on products for insert
with check (exists (select 1 from app_users where id = auth.uid() and role = 'admin'));

create policy "admins update products" on products for update
using (exists (select 1 from app_users where id = auth.uid() and role = 'admin'));

create policy "admins delete products" on products for delete
using (exists (select 1 from app_users where id = auth.uid() and role = 'admin'));
