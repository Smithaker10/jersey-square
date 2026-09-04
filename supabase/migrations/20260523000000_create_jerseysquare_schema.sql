-- JerseySquare catalog schema (see server README for API usage)

create table public.categories (
  id text primary key,
  title text not null,
  subtitle text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.products (
  id serial primary key,
  category_id text not null references public.categories(id) on delete cascade,
  name text not null,
  category_slug text not null,
  category_label text not null,
  price numeric(10, 2) not null,
  old_price numeric(10, 2) not null,
  image text not null,
  discount text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.site_settings (
  id integer primary key default 1 check (id = 1),
  brand_name text not null,
  tagline text,
  email text not null,
  phone text not null,
  instagram_url text not null,
  instagram_handle text not null,
  whatsapp_url text not null,
  whatsapp_group_url text not null,
  updated_at timestamptz not null default now()
);

create table public.stylist_inquiries (
  id uuid primary key default gen_random_uuid(),
  name text,
  email text,
  message text not null,
  created_at timestamptz not null default now()
);

create index products_category_id_idx on public.products(category_id);

alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.site_settings enable row level security;
alter table public.stylist_inquiries enable row level security;

create policy "categories_public_read" on public.categories for select using (true);
create policy "products_public_read" on public.products for select using (true);
create policy "site_settings_public_read" on public.site_settings for select using (true);
create policy "stylist_inquiries_public_insert" on public.stylist_inquiries for insert with check (true);
