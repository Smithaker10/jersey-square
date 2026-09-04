import { Router } from 'express';
import { supabase } from '../lib/supabase.js';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js';

export const cartRouter = Router();

// Get cart items for logged-in user
cartRouter.get('/', requireAuth, async (req: AuthenticatedRequest, res) => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const { data, error } = await supabase
    .from('cart')
    .select(`
      id,
      product_id,
      size,
      quantity,
      created_at,
      product:products(*)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  // Format products to match app-side model
  const items = (data ?? []).map((item: any) => {
    const prod = item.product;
    return {
      id: item.id,
      productId: item.product_id,
      size: item.size,
      quantity: item.quantity,
      createdAt: item.created_at,
      product: prod ? {
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
      } : null
    };
  });

  res.json({ items });
});

// Add item to cart
cartRouter.post('/', requireAuth, async (req: AuthenticatedRequest, res) => {
  const userId = req.user?.id;
  const { productId, size, quantity = 1 } = req.body;

  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  if (!productId || !size) {
    res.status(400).json({ error: 'Missing productId or size' });
    return;
  }

  // Check if item already exists in database
  const { data: existing, error: checkError } = await supabase
    .from('cart')
    .select('id, quantity')
    .eq('user_id', userId)
    .eq('product_id', productId)
    .eq('size', size)
    .maybeSingle();

  if (checkError) {
    res.status(500).json({ error: checkError.message });
    return;
  }

  if (existing) {
    // Update quantity
    const newQty = existing.quantity + quantity;
    const { error: updateError } = await supabase
      .from('cart')
      .update({ quantity: newQty })
      .eq('id', existing.id);

    if (updateError) {
      res.status(500).json({ error: updateError.message });
      return;
    }
  } else {
    // Insert new item
    const { error: insertError } = await supabase
      .from('cart')
      .insert({
        user_id: userId,
        product_id: productId,
        size,
        quantity,
      });

    if (insertError) {
      res.status(500).json({ error: insertError.message });
      return;
    }
  }

  res.status(201).json({ success: true });
});

// Update cart item quantity
cartRouter.put('/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
  const userId = req.user?.id;
  const id = Number(req.params.id);
  const { quantity, size } = req.body;

  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  if (Number.isNaN(id)) {
    res.status(400).json({ error: 'Invalid cart item ID' });
    return;
  }

  const updates: any = {};
  if (quantity !== undefined) {
    if (quantity <= 0) {
      // Remove item if quantity is set to 0 or less
      const { error: deleteError } = await supabase
        .from('cart')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (deleteError) {
        res.status(500).json({ error: deleteError.message });
        return;
      }
      res.json({ success: true, removed: true });
      return;
    }
    updates.quantity = quantity;
  }

  if (size !== undefined) {
    updates.size = size;
  }

  const { error: updateError } = await supabase
    .from('cart')
    .update(updates)
    .eq('id', id)
    .eq('user_id', userId);

  if (updateError) {
    res.status(500).json({ error: updateError.message });
    return;
  }

  res.json({ success: true });
});

// Delete cart item
cartRouter.delete('/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
  const userId = req.user?.id;
  const id = Number(req.params.id);

  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  if (Number.isNaN(id)) {
    res.status(400).json({ error: 'Invalid cart item ID' });
    return;
  }

  const { error } = await supabase
    .from('cart')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  res.json({ success: true });
});

// Sync cart (merge guest items on login)
cartRouter.post('/sync', requireAuth, async (req: AuthenticatedRequest, res) => {
  const userId = req.user?.id;
  const { items } = req.body; // Array of { productId, size, quantity }

  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  if (!Array.isArray(items)) {
    res.status(400).json({ error: 'Items must be an array' });
    return;
  }

  try {
    for (const item of items) {
      const { productId, size, quantity = 1 } = item;
      if (!productId || !size) continue;

      // Check if duplicate exists in DB
      const { data: existing } = await supabase
        .from('cart')
        .select('id, quantity')
        .eq('user_id', userId)
        .eq('product_id', productId)
        .eq('size', size)
        .maybeSingle();

      if (existing) {
        // Increment quantity
        await supabase
          .from('cart')
          .update({ quantity: existing.quantity + quantity })
          .eq('id', existing.id);
      } else {
        // Insert new
        await supabase
          .from('cart')
          .insert({
            user_id: userId,
            product_id: productId,
            size,
            quantity,
          });
      }
    }
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
