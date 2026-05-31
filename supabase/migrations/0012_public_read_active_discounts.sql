-- Shoppers (anon) may read only ACTIVE discounts to validate a code at checkout.
-- Coexists (permissive OR) with "admins manage discounts". Expiry enforced in app logic.
create policy "anyone reads active discounts" on discounts for select
  using (active = true);
