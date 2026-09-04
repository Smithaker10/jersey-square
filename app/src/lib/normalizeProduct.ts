import type { JerseyProduct } from '@/types/product';
import { CATEGORY_LABELS } from '@/config/sports';

/** Maps legacy DB / API category slugs to homepage section ids */
const CATEGORY_ID_MAP: Record<string, string> = {
  fan: 'fan-version',
  player: 'player-version',
  master: 'master-version',
  indian: 'indian-embroidery',
  'sublimation-jersey': 'sublimation',
};

export function normalizeCategoryId(category: string): string {
  return CATEGORY_ID_MAP[category] ?? category;
}

export function normalizeJerseyProduct(
  raw: Partial<JerseyProduct> & { name?: string },
): JerseyProduct | null {
  if (!raw.id || (!raw.title && !raw.name)) return null;

  const category = normalizeCategoryId(raw.category ?? 'fan-version');
  const sport = (raw.sport as JerseyProduct['sport']) ?? 'football';
  const isF1OrCricket = sport === 'f1' || sport === 'cricket';
  const isMaster = category === 'master-version';
  const isPlayer = category === 'player-version';
  const price = isF1OrCricket
    ? 1099
    : (isMaster ? 799 : (isPlayer ? 1299 : Number(raw.price ?? 0)));
  const rawOld = Number(raw.oldPrice ?? 0);
  const oldPrice = isF1OrCricket
    ? 1399
    : (isMaster
      ? 1099
      : (isPlayer ? 1599 : (rawOld > price ? rawOld : price + 300)));
  const discountPercent = oldPrice > price ? Math.round(((oldPrice - price) / oldPrice) * 100) : 0;
  const discount =
    raw.discount && raw.discount !== '' && raw.discount !== '-0%'
      ? raw.discount
      : discountPercent > 0
        ? `-${discountPercent}%`
        : '-21%';

  return {
    id: raw.id,
    title: raw.title ?? raw.name ?? '',
    sport: (raw.sport as JerseyProduct['sport']) ?? 'football',
    category,
    categoryLabel: raw.categoryLabel ?? CATEGORY_LABELS[category] ?? category,
    team: raw.team ?? '',
    player: raw.player ?? null,
    description: raw.description ?? '',
    stockStatus: (raw.stockStatus as JerseyProduct['stockStatus']) ?? 'in_stock',
    price,
    oldPrice,
    image: raw.image ?? '',
    discount,
    tags: raw.tags ?? [],
    popular: raw.popular ?? 50,
    createdAt: raw.createdAt ?? '2025-01-01',
  };
}
