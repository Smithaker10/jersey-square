-- Migration: Add Customer Accounts, Cart Sync, Orders, Coupons, and Wishlist tables
-- Path: supabase/migrations/20260713000000_add_auth_cart_orders_coupons.sql

-- 1. Create public.users table (extends auth.users)
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null,
  phone text not null,
  created_at timestamptz not null default now()
);

-- 2. Create coupons table
create table if not exists public.coupons (
  id bigint generated always as identity primary key,
  code text not null unique,
  discount_type text not null check (discount_type in ('percentage', 'fixed')),
  discount_value numeric(10, 2) not null,
  min_amount numeric(10, 2) not null default 0,
  max_discount numeric(10, 2),
  usage_limit integer,
  usage_count integer not null default 0,
  expiry_date timestamptz,
  created_at timestamptz not null default now()
);

-- 3. Create cart table
create table if not exists public.cart (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id bigint not null references public.products(id) on delete cascade,
  size text not null,
  quantity integer not null check (quantity > 0),
  created_at timestamptz not null default now(),
  unique(user_id, product_id, size)
);

-- 4. Create wishlist table
create table if not exists public.wishlist (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id bigint not null references public.products(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(user_id, product_id)
);

-- 5. Create orders table
create table if not exists public.orders (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users(id) on delete set null,
  customer_name text not null,
  customer_phone text not null,
  customer_email text not null,
  address text not null,
  area text,
  city text not null,
  pin text not null,
  coupon text,
  notes text,
  subtotal numeric(10, 2) not null,
  shipping numeric(10, 2) not null default 99,
  discount numeric(10, 2) not null default 0,
  total numeric(10, 2) not null,
  status text not null default 'Pending' check (status in ('Pending', 'Confirmed', 'Packed', 'Shipped', 'Delivered', 'Cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 6. Create order_items table
create table if not exists public.order_items (
  id bigint generated always as identity primary key,
  order_id bigint not null references public.orders(id) on delete cascade,
  product_id bigint references public.products(id) on delete set null,
  product_name text not null,
  product_image text,
  size text not null,
  quantity integer not null check (quantity > 0),
  price numeric(10, 2) not null
);

-- 7. Triggers for updating orders.updated_at
create or replace function public.set_orders_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql security definer;

create trigger orders_updated_at
  before update on public.orders
  for each row execute function public.set_orders_updated_at();

-- 8. Auto-Sync Trigger for new user registration
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, full_name, email, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
    new.email,
    coalesce(new.raw_user_meta_data->>'phone', '')
  );
  return new;
exception when others then
  -- Ignore failures so registration isn't blocked if metadata format differs
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 9. Enable RLS and add policies
alter table public.users enable row level security;
alter table public.coupons enable row level security;
alter table public.cart enable row level security;
alter table public.wishlist enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

-- Simple development-friendly policies (Allow all access for public + express api requests)
create policy "Allow all operations for users" on public.users for all using (true) with check (true);
create policy "Allow all operations for coupons" on public.coupons for all using (true) with check (true);
create policy "Allow all operations for cart" on public.cart for all using (true) with check (true);
create policy "Allow all operations for wishlist" on public.wishlist for all using (true) with check (true);
create policy "Allow all operations for orders" on public.orders for all using (true) with check (true);
create policy "Allow all operations for order_items" on public.order_items for all using (true) with check (true);

-- 10. Seed default coupons
insert into public.coupons (code, discount_type, discount_value, min_amount, max_discount, usage_limit, usage_count)
values 
  ('FIRST5', 'percentage', 5.00, 0.00, 200.00, null, 0),
  ('NEW5', 'percentage', 5.00, 0.00, 200.00, null, 0),
  ('WELCOME10', 'percentage', 10.00, 500.00, 500.00, null, 0),
  ('FREESHIP', 'fixed', 99.00, 1000.00, null, null, 0),
  ('RETRO15', 'percentage', 15.00, 1500.00, 400.00, null, 0)
on conflict (code) do nothing;
