-- Enable RLS on product_3d (public display data, readable by anyone)
alter table product_3d enable row level security;

create policy "product_3d readable by anyone"
  on product_3d for select using (true);
