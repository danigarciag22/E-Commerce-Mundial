-- Demo / visualization data for the CRM. Removable later.
-- Wipe: delete from orders where payment_intent_id like 'demo-%';
--       delete from discounts where code in ('MUNDIAL10','HINCHA20','ENVIOGRATIS','VIEJO5');
--       delete from collections where slug in ('colombia','argentina','brasil','mundial-2026','ofertas');

update products set stock = (10 + (abs(hashtext(sku)) % 90)) where stock = 0;
update products set stock = 3 where sku in ('BAL-FIFA-001','UNI-COL-001');
update products set stock = 0 where sku = 'MER-TRM-001';

insert into collections (name, slug, description) values
  ('Selección Colombia', 'colombia', 'Todo para la tricolor'),
  ('Argentina', 'argentina', 'Campeón vigente'),
  ('Brasil', 'brasil', 'Pentacampeón'),
  ('Mundial 2026', 'mundial-2026', 'Edición del torneo'),
  ('Ofertas', 'ofertas', 'Precios especiales')
on conflict (slug) do nothing;

insert into product_collections (product_id, collection_id)
select p.id, c.id from products p, collections c
where (c.slug = 'colombia' and p.sku like '%COL%')
   or (c.slug = 'argentina' and p.sku like '%ARG%')
   or (c.slug = 'brasil' and p.sku like '%BRA%')
   or (c.slug = 'mundial-2026' and p.sku like '%FIFA%')
on conflict do nothing;

insert into discounts (code, percent, active, expires_at) values
  ('MUNDIAL10', 10, true, now() + interval '60 days'),
  ('HINCHA20', 20, true, now() + interval '30 days'),
  ('ENVIOGRATIS', 15, true, null),
  ('VIEJO5', 5, false, now() - interval '5 days')
on conflict (code) do nothing;

-- Demo orders over 90 days, varied status/totals, guest (customer_email).
-- CRM "customers" are derived from these order emails (matches guest-checkout reality):
-- app_users.id FKs auth.users, so demo customers can't be plain profile rows.
insert into orders (id, user_id, customer_email, items, total, status, payment_intent_id, created_at)
select
  gen_random_uuid(),
  null,
  'cliente' || (1 + (g % 15)) || '@demo.com',
  '[{"id":"demo","name":"Producto demo","price":100000,"category":"uniforme","quantity":1}]'::jsonb,
  (50000 + (abs(hashtext(g::text)) % 900000)),
  (array['paid','paid','paid','pending','shipped','cancelled'])[1 + (g % 6)],
  'demo-' || g,
  now() - ((abs(hashtext(g::text)) % 90) || ' days')::interval
from generate_series(1, 40) g;
