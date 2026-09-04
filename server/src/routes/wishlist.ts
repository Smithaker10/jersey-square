import { Router } from 'express';
import { supabase } from '../lib/supabase.js';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js';

export const wishlistRouter = Router();

// Get wishlist items for logged-in user
wishlistRouter.get('/', requireAuth, async (req: AuthenticatedRequest, res) => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const { data, error } = await supabase
    .from('wishlist')
    .select(`
      product_id,
      product:products(*)
    `)
    .eq('user_id', userId);

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  // Format products
  const products = (data ?? [])
    .map((item: any) => item.product)
    .filter(Boolean)
    .map((prod: any) => ({
      id: prod.id,
      title: prod.name,
      sport: prod.sport,
      category: prod.category,
      categoryLabel: prod.category_label,
      team: prod.team,
      player: prod.player,
      price: Number(prod.price),
      oldPrice: Number(prod.old_price && Number(prod.old_price) > Number(prod.price) ? prod.old_price : Number(prod.price) + 300),
      image: prod.image_url,
      discount: prod.discount,
      tags: prod.tags ?? [],
      popular: prod.popular_score ?? 50,
    }));

  res.json({ products });
});

// Toggle wishlist item
wishlistRouter.post('/', requireAuth, async (req: AuthenticatedRequest, res) => {
  const userId = req.user?.id;
  const { productId } = req.body;

  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  if (!productId) {
    res.status(400).json({ error: 'Missing productId' });
    return;
  }

  // Check if item exists in wishlist
  const { data: existing, error: checkError } = await supabase
    .from('wishlist')
    .select('id')
    .eq('user_id', userId)
    .eq('product_id', productId)
    .maybeSingle();

  if (checkError) {
    res.status(500).json({ error: checkError.message });
    return;
  }

  if (existing) {
    // Remove from wishlist
    const { error: deleteError } = await supabase
      .from('wishlist')
      .delete()
      .eq('id', existing.id);

    if (deleteError) {
      res.status(500).json({ error: deleteError.message });
      return;
    }
    res.json({ success: true, wished: false });
  } else {
    // Add to wishlist
    const { error: insertError } = await supabase
      .from('wishlist')
      .insert({
        user_id: userId,
        product_id: productId,
      });

    if (insertError) {
      res.status(500).json({ error: insertError.message });
      return;
    }
    res.json({ success: true, wished: true });
  }
});
