alter table public.products
  add column if not exists description text not null default '',
  add column if not exists stock_status text not null default 'in_stock';

update public.products
set description = coalesce(description, ''),
    stock_status = coalesce(stock_status, 'in_stock');