import { Router } from 'express';
import { supabase } from '../lib/supabase.js';

export const productsRouter = Router();

productsRouter.get('/', async (_req, res) => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
      .eq('is_visible', true)
    .order('sort_order', { ascending: true });

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  const products = (data ?? []).map((row) => {
    const sport = row.sport ?? 'football';
    const isF1OrCricket = sport === 'f1' || sport === 'cricket';
    const isMaster = row.category === 'master-version';
    const isPlayer = row.category === 'player-version';
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
      sport: row.sport ?? 'football',
      category: row.category,
      categoryLabel: row.category_label ?? row.category,
      team: row.team ?? '',
      player: row.player ?? null,
      price,
      oldPrice,
      image: row.image_url ?? '',
      discount,
      tags: row.tags ?? [],
      popular: row.popular_score ?? 50,
      createdAt: row.created_at?.slice(0, 10) ?? '2025-01-01',
    };
  });

  res.json({ products });
});
