alter function public.set_products_updated_at() set search_path = public;

drop policy if exists "Allow public read product images" on storage.objects;
drop policy if exists "product_images_public_read" on storage.objects;