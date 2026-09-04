/** Legacy category grouping — derived from catalog for fallback */
import { catalogProducts } from '@/data/catalog';
import type { Category } from '@/types/product';
import { toLegacyProduct } from '@/types/product';

export type { Category, Product } from '@/types/product';
export { toLegacyProduct };

const footballSubs = [
  { id: 'fan-version', title: 'FAN VERSION', subtitle: 'Embroidered logos, comes with shorts, made in Thailand.' },
  { id: 'player-version', title: 'PLAYER VERSION', subtitle: 'Jersey that players wear, heat-pressed logos, made in Thailand.' },
  { id: 'master-version', title: 'MASTER VERSION', subtitle: 'Upgraded version of fan version, premium finishing, made in Thailand.' },
  { id: 'sublimation', title: 'SUBLIMATION JERSEY', subtitle: 'Printed logos, lightweight, affordable pricing.' },
  { id: 'retro', title: 'RETRO', subtitle: 'Classic kits from iconic seasons.' },
  { id: 'anime', title: 'ANIME', subtitle: 'Limited anime collaboration editions.' },
];

export const categories: Category[] = footballSubs.map((cat) => ({
  ...cat,
  products: catalogProducts
    .filter((p) => p.sport === 'football' && p.category === cat.id)
    .map(toLegacyProduct),
}));
