-- Admins can change order status.
create policy "admins update orders" on orders for update
  using (public.is_admin()) with check (public.is_admin());
