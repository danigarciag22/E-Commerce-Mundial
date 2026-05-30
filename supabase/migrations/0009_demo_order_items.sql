-- Rewrite demo orders to reference a real product (deterministic pick per order),
-- quantity 1-3, total = price*qty, so the dashboard top-products chart is meaningful.
with picked as (
  select o.id as order_id,
         (select p.id from products p order by md5(p.id::text || o.id::text) limit 1) as product_id
  from orders o
  where o.payment_intent_id like 'demo-%'
)
update orders o
set items = jsonb_build_array(jsonb_build_object(
      'id', p.id, 'name', p.name, 'price', p.price, 'category', p.category,
      'quantity', 1 + (abs(hashtext(o.id::text)) % 3))),
    total = p.price * (1 + (abs(hashtext(o.id::text)) % 3))
from picked, products p
where picked.order_id = o.id and p.id = picked.product_id;
