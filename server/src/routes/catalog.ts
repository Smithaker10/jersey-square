import { Router } from 'express';
import { supabase } from '../lib/supabase.js';
import type { Category, DbCategory, DbProduct, Product } from '../types.js';

export const catalogRouter = Router();

const CATEGORY_LABELS: Record<string, string> = {
  'player-version': 'Player',
  'fan-version': 'Fan',
  'master-version': 'Master',
  'indian-embroidery': 'Indian',
  sublimation: 'Sublimation',
  retro: 'Retro',
  anime: 'Anime',
};

function deriveDiscount(price: number, oldPrice?: number | null, discount?: string | null) {
  if (discount?.trim() && discount !== '-0%') return discount;

  const previous = oldPrice && oldPrice > price ? oldPrice : price + 300;
  const amount = Math.round(((previous - price) / previous) * 100);
  return `-${amount}%`;
}

function mapProduct(row: DbProduct): Product {
  const category = row.category;
  const sport = row.sport ?? 'football';
  const isF1OrCricket = sport === 'f1' || sport === 'cricket';
  const isMaster = category === 'master-version';
  const isPlayer = category === 'player-version';
  const price = isF1OrCricket
    ? 1099
    : (isMaster ? 799 : (isPlayer ? 1299 : Number(row.price)));
  const rawOld = Number(row.old_price ?? 0);
  const oldPrice = isF1OrCricket
    ? 1399
    : (isMaster
      ? 1099
      : (isPlayer ? 1599 : (rawOld > price ? rawOld : price + 300)));

  return {
    id: row.id,
    name: row.name,
    category,
    categoryLabel: row.category_label ?? CATEGORY_LABELS[category] ?? category,
    price,
    oldPrice,
    image: row.image_url ?? '',
    discount: deriveDiscount(price, oldPrice, row.discount),
  };
}

catalogRouter.get('/', async (_req, res) => {
  const [categoriesResult, productsResult] = await Promise.all([
    supabase
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true }),
    supabase
      .from('products')
      .select('*')
      .eq('is_visible', true)
      .order('sort_order', { ascending: true }),
  ]);

  if (categoriesResult.error) {
    res.status(500).json({ error: categoriesResult.error.message });
    return;
  }

  if (productsResult.error) {
    res.status(500).json({ error: productsResult.error.message });
    return;
  }

  const productsByCategory = new Map<string, Product[]>();

  for (const row of (productsResult.data ?? []) as DbProduct[]) {
    const list = productsByCategory.get(row.category) ?? [];
    list.push(mapProduct(row));
    productsByCategory.set(row.category, list);
  }

  const catalog: Category[] = ((categoriesResult.data ?? []) as DbCategory[]).map(
    (category) => ({
      id: category.id,
      title: category.title,
      subtitle: category.subtitle,
      products: productsByCategory.get(category.id) ?? [],
    }),
  );

  res.json({ categories: catalog });
});
