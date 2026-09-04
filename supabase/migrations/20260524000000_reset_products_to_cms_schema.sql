drop table if exists public.products cascade;

create table public.products (
  id bigint generated always as identity primary key,
  name text not null,
  description text,
  sport text not null,
  category text not null,
  category_label text,
  team text,
  player text,
  price integer not null,
  old_price integer,
  stock_status text not null default 'In stock',
  image_url text,
  discount text not null default '-50%',
  tags text[] not null default '{}',
  popular_score integer not null default 0,
  is_visible boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.products enable row level security;

create policy "Allow all operations"
on public.products
for all
using (true)
with check (true);

create policy "Allow public read products"
on public.products
for select
using (true);

create index products_category_idx on public.products(category);
create index products_sport_idx on public.products(sport);
create index products_visible_idx on public.products(is_visible);

create or replace function public.set_products_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists products_updated_at on public.products;

create trigger products_updated_at
before update on public.products
for each row execute function public.set_products_updated_at();

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do update
set name = excluded.name,
    public = excluded.public;

drop policy if exists "Allow public read product images" on storage.objects;
drop policy if exists "Allow upload product images" on storage.objects;
drop policy if exists "Allow update product images" on storage.objects;
drop policy if exists "Allow delete product images" on storage.objects;

create policy "Allow public read product images"
on storage.objects
for select
using (bucket_id = 'product-images');

create policy "Allow upload product images"
on storage.objects
for insert
with check (bucket_id = 'product-images');

create policy "Allow update product images"
on storage.objects
for update
using (bucket_id = 'product-images')
with check (bucket_id = 'product-images');

create policy "Allow delete product images"
on storage.objects
for delete
using (bucket_id = 'product-images');