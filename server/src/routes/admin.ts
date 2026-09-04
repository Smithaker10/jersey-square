import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { supabase } from '../lib/supabase.js';
import { requireAdmin } from '../middleware/adminAuth.js';
import type { DbProduct } from '../types.js';

export const adminRouter = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

const STOCK_STATUS_VALUES = ['in_stock', 'low_stock', 'out_of_stock', 'preorder'] as const;
type StockStatus = (typeof STOCK_STATUS_VALUES)[number];

const CATEGORY_LABELS: Record<string, string> = {
  'player-version': 'Player',
  'fan-version': 'Fan',
  'master-version': 'Master',
  'indian-embroidery': 'Indian',
  sublimation: 'Sublimation',
  retro: 'Retro',
  anime: 'Anime',
};

const productSchema = z.object({
  name: z.string().min(2),
  description: z.string().default(''),
  sport: z.enum(['football', 'f1', 'cricket']),
  category: z.string().min(1).optional(),
  categoryId: z.string().min(1).optional(),
  categoryLabel: z.string().optional(),
  team: z.string().min(1),
  player: z.string().optional(),
  price: z.coerce.number().int().nonnegative(),
  oldPrice: z.coerce.number().int().optional(),
  old_price: z.coerce.number().int().optional(),
  stockStatus: z.enum(STOCK_STATUS_VALUES).optional(),
  stock_status: z.enum(STOCK_STATUS_VALUES).optional(),
  image: z.string().optional(),
  imageUrl: z.string().optional(),
  image_url: z.string().optional(),
  discount: z.string().optional(),
  tags: z.union([z.array(z.string()), z.string()]).optional(),
  popular: z.coerce.number().int().optional(),
  popularScore: z.coerce.number().int().optional(),
  popular_score: z.coerce.number().int().optional(),
  isVisible: z.coerce.boolean().optional(),
  is_visible: z.coerce.boolean().optional(),
  sortOrder: z.coerce.number().int().optional(),
  sort_order: z.coerce.number().int().optional(),
});

const couponSchema = z.object({
  code: z.string().min(1),
  discountType: z.enum(['percentage', 'fixed']),
  discountValue: z.coerce.number().positive(),
  minAmount: z.coerce.number().nonnegative().default(0),
  maxDiscount: z.coerce.number().nullable().optional(),
  usageLimit: z.coerce.number().int().nullable().optional(),
  expiryDate: z.string().nullable().optional(),
});

type ProductPayload = z.infer<typeof productSchema>;

function deriveDiscount(price: number, oldPrice?: number | null, discount?: string | null) {
  if (discount?.trim() && discount !== '-0%') return discount.trim();

  const previous = oldPrice && oldPrice > price ? oldPrice : price + 300;
  const amount = Math.round(((previous - price) / previous) * 100);
  return `-${amount}%`;
}

function normalizeTags(tags: ProductPayload['tags']) {
  if (Array.isArray(tags)) {
    return tags.map((tag) => tag.trim()).filter(Boolean);
  }

  if (typeof tags === 'string') {
    return tags
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);
  }

  return [];
}

function mapProductRow(row: DbProduct) {
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
  const categoryLabel = row.category_label ?? CATEGORY_LABELS[category] ?? category;

  return {
    id: row.id,
    name: row.name,
    sport: row.sport,
    categoryId: category,
    category,
    categoryLabel,
    team: row.team ?? '',
    player: row.player ?? '',
    description: row.description ?? '',
    stockStatus: (row.stock_status as StockStatus) ?? 'in_stock',
    price,
    oldPrice,
    image: row.image_url ?? '',
    imageUrl: row.image_url ?? '',
    discount: deriveDiscount(price, oldPrice, row.discount),
    tags: row.tags ?? [],
    popular: Number(row.popular_score ?? 0),
    popularScore: Number(row.popular_score ?? 0),
    isVisible: row.is_visible ?? true,
    sortOrder: row.sort_order ?? 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function normalizeProductPayload(product: ProductPayload) {
  const category = product.category ?? product.categoryId ?? 'fan-version';
  const rawOld = Number(product.oldPrice ?? product.old_price ?? 0);
  const oldPrice = rawOld > product.price ? rawOld : product.price + 300;
  const imageUrl = product.imageUrl ?? product.image_url ?? product.image ?? '';
  const categoryLabel = product.categoryLabel ?? CATEGORY_LABELS[category] ?? category;

  return {
    name: product.name.trim(),
    description: product.description.trim(),
    sport: product.sport,
    category,
    category_label: categoryLabel,
    team: product.team.trim(),
    player: product.player?.trim() ? product.player.trim() : null,
    price: product.price,
    old_price: oldPrice,
    stock_status: product.stockStatus ?? product.stock_status ?? 'in_stock',
    image_url: imageUrl,
    discount: deriveDiscount(product.price, oldPrice, product.discount),
    tags: normalizeTags(product.tags),
    popular_score: Number(product.popular ?? product.popularScore ?? product.popular_score ?? 0),
    is_visible: product.isVisible ?? product.is_visible ?? true,
    sort_order: Number(product.sortOrder ?? product.sort_order ?? 0),
  };
}

// Secure all admin routes
adminRouter.use(requireAdmin);

// ================= PRODUCT ENDPOINTS =================

adminRouter.get('/products', async (_req, res) => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  res.json({ products: (data ?? []).map(mapProductRow) });
});

adminRouter.post('/upload', upload.single('image'), async (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: 'No image file provided' });
    return;
  }

  const extension = req.file.originalname.split('.').pop() ?? 'jpg';
  const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from('product-images')
    .upload(path, req.file.buffer, {
      contentType: req.file.mimetype,
      upsert: false,
    });

  if (uploadError) {
    res.status(500).json({ error: uploadError.message });
    return;
  }

  const { data } = supabase.storage.from('product-images').getPublicUrl(path);

  res.json({ url: data.publicUrl, path });
});

adminRouter.post('/products', async (req, res) => {
  const parsed = productSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const { data, error } = await supabase
    .from('products')
    .insert(normalizeProductPayload(parsed.data))
    .select('*')
    .single();

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  res.status(201).json({ product: mapProductRow(data) });
});

adminRouter.put('/products/:id', async (req, res) => {
  const parsed = productSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    res.status(400).json({ error: 'Invalid product id' });
    return;
  }

  const { data, error } = await supabase
    .from('products')
    .update(normalizeProductPayload(parsed.data))
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  res.json({ product: mapProductRow(data) });
});

adminRouter.delete('/products/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    res.status(400).json({ error: 'Invalid product id' });
    return;
  }

  const { error } = await supabase.from('products').delete().eq('id', id);

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  res.status(204).send();
});

// ================= ORDER ENDPOINTS =================

// Get all orders
adminRouter.get('/orders', async (_req, res) => {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      items:order_items(*)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  res.json({ orders: data ?? [] });
});

// Update order status
adminRouter.put('/orders/:id/status', async (req, res) => {
  const orderId = Number(req.params.id);
  const { status } = req.body;

  if (Number.isNaN(orderId)) {
    res.status(400).json({ error: 'Invalid order ID' });
    return;
  }

  const validStatuses = ['Pending', 'Confirmed', 'Packed', 'Shipped', 'Delivered', 'Cancelled'];
  if (!validStatuses.includes(status)) {
    res.status(400).json({ error: 'Invalid order status value' });
    return;
  }

  const { data, error } = await supabase
    .from('orders')
    .update({ status })
    .eq('id', orderId)
    .select(`
      *,
      items:order_items(*)
    `)
    .single();

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  res.json({ order: data });
});

// ================= CUSTOMER ENDPOINTS =================

// List all customers with consolidated details
adminRouter.get('/customers', async (_req, res) => {
  const { data, error } = await supabase
    .from('users')
    .select(`
      id,
      full_name,
      email,
      phone,
      created_at,
      orders:orders(id, total, status, created_at)
    `);

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  const customers = (data ?? []).map((user: any) => {
    const userOrders = user.orders ?? [];
    const completedOrders = userOrders.filter((o: any) => o.status !== 'Cancelled');
    const lifetimeValue = completedOrders.reduce((sum: number, o: any) => sum + Number(o.total), 0);

    return {
      id: user.id,
      name: user.full_name,
      email: user.email,
      phone: user.phone,
      joinedAt: user.created_at,
      totalOrders: userOrders.length,
      lifetimeValue: Math.round(lifetimeValue),
      orders: userOrders.map((o: any) => ({
        id: o.id,
        total: Number(o.total),
        status: o.status,
        createdAt: o.created_at
      })).sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    };
  });

  res.json({ customers });
});

// ================= COUPON ENDPOINTS =================

// Get all coupons
adminRouter.get('/coupons', async (_req, res) => {
  const { data, error } = await supabase
    .from('coupons')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  const coupons = (data ?? []).map((c: any) => ({
    id: c.id,
    code: c.code,
    discountType: c.discount_type,
    discountValue: Number(c.discount_value),
    minAmount: Number(c.min_amount),
    maxDiscount: c.max_discount ? Number(c.max_discount) : null,
    usageLimit: c.usage_limit,
    usageCount: c.usage_count,
    expiryDate: c.expiry_date,
    createdAt: c.created_at
  }));

  res.json({ coupons });
});

// Create a coupon
adminRouter.post('/coupons', async (req, res) => {
  const parsed = couponSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const payload = parsed.data;
  const { data, error } = await supabase
    .from('coupons')
    .insert({
      code: payload.code.trim().toUpperCase(),
      discount_type: payload.discountType,
      discount_value: payload.discountValue,
      min_amount: payload.minAmount,
      max_discount: payload.maxDiscount,
      usage_limit: payload.usageLimit,
      expiry_date: payload.expiryDate || null,
      usage_count: 0
    })
    .select('*')
    .single();

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  res.status(201).json({ coupon: data });
});

// Update a coupon
adminRouter.put('/coupons/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    res.status(400).json({ error: 'Invalid coupon ID' });
    return;
  }

  const parsed = couponSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const payload = parsed.data;
  const { data, error } = await supabase
    .from('coupons')
    .update({
      code: payload.code.trim().toUpperCase(),
      discount_type: payload.discountType,
      discount_value: payload.discountValue,
      min_amount: payload.minAmount,
      max_discount: payload.maxDiscount,
      usage_limit: payload.usageLimit,
      expiry_date: payload.expiryDate || null
    })
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  res.json({ coupon: data });
});

// Delete a coupon
adminRouter.delete('/coupons/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    res.status(400).json({ error: 'Invalid coupon ID' });
    return;
  }

  const { error } = await supabase.from('coupons').delete().eq('id', id);
  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  res.status(204).send();
});

// ================= ANALYTICS ENDPOINTS =================

adminRouter.get('/analytics', async (_req, res) => {
  // Fetch all orders with items
  const { data: orders, error } = await supabase
    .from('orders')
    .select(`
      id,
      total,
      status,
      created_at,
      user_id,
      items:order_items(size, quantity, product_name, product_id)
    `);

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  // Fetch all products (to match club teams)
  const { data: products } = await supabase.from('products').select('id, team');
  const productTeamMap = new Map<number, string>();
  if (products) {
    products.forEach((p) => productTeamMap.set(p.id, p.team || 'Other'));
  }

  const validOrders = (orders ?? []).filter((o: any) => o.status !== 'Cancelled');
  
  // 1. Key Metrics
  const totalRevenue = validOrders.reduce((sum: number, o: any) => sum + Number(o.total), 0);
  const totalOrders = validOrders.length;
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  // Repeat rate: users with >1 orders / total users with orders
  const userOrderCounts: Record<string, number> = {};
  validOrders.forEach((o: any) => {
    if (o.user_id) {
      userOrderCounts[o.user_id] = (userOrderCounts[o.user_id] || 0) + 1;
    }
  });
  const totalPayingUsers = Object.keys(userOrderCounts).length;
  const repeatPayingUsers = Object.values(userOrderCounts).filter((c) => c > 1).length;
  const repeatCustomerRate = totalPayingUsers > 0 ? (repeatPayingUsers / totalPayingUsers) * 100 : 0;

  // 2. Top Clubs/Teams
  const teamSales: Record<string, number> = {};
  validOrders.forEach((o: any) => {
    (o.items ?? []).forEach((item: any) => {
      const team = productTeamMap.get(item.product_id) || 'Unknown';
      teamSales[team] = (teamSales[team] || 0) + item.quantity;
    });
  });
  const topClubs = Object.entries(teamSales)
    .map(([team, quantity]) => ({ name: team, value: quantity }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  // 3. Top Sizes
  const sizeSales: Record<string, number> = {};
  validOrders.forEach((o: any) => {
    (o.items ?? []).forEach((item: any) => {
      sizeSales[item.size] = (sizeSales[item.size] || 0) + item.quantity;
    });
  });
  const topSizes = Object.entries(sizeSales)
    .map(([size, quantity]) => ({ name: size, value: quantity }))
    .sort((a, b) => b.value - a.value);

  // 4. Order Status Breakdown
  const statusCounts: Record<string, number> = {};
  (orders ?? []).forEach((o: any) => {
    statusCounts[o.status] = (statusCounts[o.status] || 0) + 1;
  });
  const orderStatuses = Object.entries(statusCounts).map(([status, count]) => ({
    name: status,
    value: count,
  }));

  // 5. Monthly Sales Trend (Last 6 Months)
  const monthlyRevenue: Record<string, number> = {};
  validOrders.forEach((o: any) => {
    const date = new Date(o.created_at);
    // Format "MMM YYYY" (e.g. "Jul 2026")
    const key = date.toLocaleString('default', { month: 'short', year: 'numeric' });
    monthlyRevenue[key] = (monthlyRevenue[key] || 0) + Number(o.total);
  });

  // Sort monthly sales chronologically
  const monthlySales = Object.entries(monthlyRevenue)
    .map(([month, revenue]) => ({ month, revenue: Math.round(revenue) }))
    .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime())
    .slice(-6);

  res.json({
    metrics: {
      totalRevenue: Math.round(totalRevenue),
      totalOrders,
      averageOrderValue: Math.round(averageOrderValue),
      repeatCustomerRate: Math.round(repeatCustomerRate),
    },
    topClubs,
    topSizes,
    orderStatuses,
    monthlySales,
  });
});
