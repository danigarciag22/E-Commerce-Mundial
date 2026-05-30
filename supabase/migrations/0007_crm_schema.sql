alter table products add column if not exists stock int not null default 0;
alter table products add column if not exists active boolean not null default true;

alter table orders add column if not exists customer_email text;

create table if not exists collections (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique,
  description text,
  created_at  timestamptz not null default now()
);

create table if not exists product_collections (
  product_id    uuid references products(id) on delete cascade,
  collection_id uuid references collections(id) on delete cascade,
  primary key (product_id, collection_id)
);

create table if not exists discounts (
  id         uuid primary key default gen_random_uuid(),
  code       text not null unique,
  percent    int not null check (percent between 1 and 100),
  active      boolean not null default true,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

alter table collections enable row level security;
alter table product_collections enable row level security;
alter table discounts enable row level security;

create policy "collections readable by anyone" on collections for select using (true);
create policy "product_collections readable by anyone" on product_collections for select using (true);

create policy "admins manage collections" on collections for all
  using (exists (select 1 from app_users where id = auth.uid() and role = 'admin'))
  with check (exists (select 1 from app_users where id = auth.uid() and role = 'admin'));
create policy "admins manage product_collections" on product_collections for all
  using (exists (select 1 from app_users where id = auth.uid() and role = 'admin'))
  with check (exists (select 1 from app_users where id = auth.uid() and role = 'admin'));
create policy "admins read discounts" on discounts for select
  using (exists (select 1 from app_users where id = auth.uid() and role = 'admin'));
create policy "admins manage discounts" on discounts for all
  using (exists (select 1 from app_users where id = auth.uid() and role = 'admin'))
  with check (exists (select 1 from app_users where id = auth.uid() and role = 'admin'));

create policy "admins read all profiles" on app_users for select
  using (exists (select 1 from app_users a where a.id = auth.uid() and a.role = 'admin'));
