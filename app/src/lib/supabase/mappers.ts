import { normalizeCategoryId } from '@/lib/normalizeProduct';
import { CATEGORY_LABELS } from '@/config/sports';
import type { Database } from '@/types/database';
import type { JerseyProduct } from '@/types/product';

export type ProductRow = Database['public']['Tables']['products']['Row'];
export type CategoryRow = Database['public']['Tables']['categories']['Row'];

export function mapProductRow(row: ProductRow): JerseyProduct {
  const category = normalizeCategoryId(row.category);
  const sport = (row.sport as JerseyProduct['sport']) ?? 'football';
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
  const discountPercent = Math.round(((oldPrice - price) / oldPrice) * 100);
  const discount =
    row.discount && row.discount !== '' && row.discount !== '-0%'
      ? row.discount
      : `-${discountPercent}%`;

  return {
    id: row.id,
    title: row.name,
    sport: row.sport as JerseyProduct['sport'],
    category,
    categoryLabel: row.category_label ?? CATEGORY_LABELS[category] ?? category,
    team: row.team ?? '',
    player: row.player,
    description: row.description ?? '',
    stockStatus: (row.stock_status as JerseyProduct['stockStatus']) ?? 'in_stock',
    price,
    oldPrice,
    image: row.image_url ?? '',
    discount,
    tags: row.tags ?? [],
    popular: row.popular_score ?? 50,
    createdAt: row.created_at?.slice(0, 10) ?? '2025-01-01',
  };
}

export interface CatalogCategory {
  id: string;
  title: string;
  subtitle: string;
  sortOrder: number;
  sport: string;
}

export function mapCategoryRow(row: CategoryRow): CatalogCategory {
  return {
    id: row.id,
    title: row.title,
    subtitle: row.subtitle,
    sortOrder: row.sort_order,
    sport: row.sport,
  };
}
