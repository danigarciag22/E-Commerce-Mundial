-- Core schema for ecommerce futbol mundial

create table if not exists products (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  sku         text not null unique,
  price       numeric(12,2) not null check (price >= 0),
  description text,
  category    text not null check (category in ('uniforme','zapato','balon','merchandising')),
  created_at  timestamptz not null default now()
);

create table if not exists product_3d (
  product_id      uuid primary key references products(id) on delete cascade,
  model_url       text,
  background_url  text,
  lighting_preset text
);

create table if not exists app_users (
  id         uuid primary key references auth.users(id) on delete cascade,
  email      text not null,
  role       text not null default 'customer' check (role in ('admin','customer')),
  created_at timestamptz not null default now()
);

create table if not exists orders (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid references app_users(id),
  items             jsonb not null,
  total             numeric(12,2) not null check (total >= 0),
  status            text not null default 'pending'
                    check (status in ('pending','paid','shipped','cancelled')),
  payment_intent_id text,
  created_at        timestamptz not null default now()
);

-- Row Level Security
alter table products  enable row level security;
alter table orders    enable row level security;
alter table app_users enable row level security;

-- Public can read products
create policy "products are readable by anyone"
  on products for select using (true);

-- Users see only their own orders
create policy "users read own orders"
  on orders for select using (auth.uid() = user_id);

-- Users read own profile
create policy "users read own profile"
  on app_users for select using (auth.uid() = id);
