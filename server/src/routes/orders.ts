import { Router } from 'express';
import { supabase } from '../lib/supabase.js';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js';

export const ordersRouter = Router();

// Get order history for current user
ordersRouter.get('/', requireAuth, async (req: AuthenticatedRequest, res) => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      items:order_items(*)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  res.json({ orders: data ?? [] });
});

// Get order by ID for tracking
ordersRouter.get('/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
  const userId = req.user?.id;
  const orderId = Number(req.params.id);

  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  if (Number.isNaN(orderId)) {
    res.status(400).json({ error: 'Invalid order ID' });
    return;
  }

  const { data: order, error } = await supabase
    .from('orders')
    .select(`
      *,
      items:order_items(*)
    `)
    .eq('id', orderId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  if (!order) {
    res.status(404).json({ error: 'Order not found' });
    return;
  }

  res.json({ order });
});

// Create Order (Checkout)
ordersRouter.post('/', requireAuth, async (req: AuthenticatedRequest, res) => {
  const userId = req.user?.id;
  const userEmail = req.user?.email || '';
  const { fullName: reqFullName, phone: reqPhone, address, area, city, pin, notes = '' } = req.body;
  let requestedCoupon = String(req.body.coupon ?? '').trim().toUpperCase();

  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  if (!address || !city || !pin) {
    res.status(400).json({ error: 'Delivery address, city, and PIN code are required' });
    return;
  }

  // 1. Fetch user's profile to get default name and phone
  const { data: profile } = await supabase
    .from('users')
    .select('full_name, phone')
    .eq('id', userId)
    .maybeSingle();

  const customerName = String(reqFullName || profile?.full_name || '').trim();
  const customerPhone = String(reqPhone || profile?.phone || '').trim();

  if (!customerName) {
    res.status(400).json({ error: 'Full name is required' });
    return;
  }

  if (!customerPhone) {
    res.status(400).json({ error: 'WhatsApp phone number is required' });
    return;
  }

  // Update profile if details changed
  if (profile && (customerName !== profile.full_name || customerPhone !== profile.phone)) {
    await supabase
      .from('users')
      .update({ full_name: customerName, phone: customerPhone })
      .eq('id', userId);
  }

  // 2. Fetch user's cart items from DB
  const { data: cartData, error: cartError } = await supabase
    .from('cart')
    .select(`
      size,
      quantity,
      product:products(*)
    `)
    .eq('user_id', userId);

  if (cartError) {
    res.status(500).json({ error: cartError.message });
    return;
  }

  if (!cartData || cartData.length === 0) {
    res.status(400).json({ error: 'Your cart is empty' });
    return;
  }

  // 3. Verify prices and calculate subtotal
  let subtotal = 0;
  const orderItemsPayload: any[] = [];

  for (const item of cartData) {
    let prod = item.product as any;
    if (Array.isArray(prod)) {
      prod = prod[0];
    }
    if (!prod || !prod.is_visible) {
      res.status(400).json({ error: `Product "${prod?.name || 'Unknown'}" is no longer available.` });
      return;
    }
    const itemPrice = Number(prod.price);
    subtotal += itemPrice * item.quantity;

    orderItemsPayload.push({
      product_id: prod.id,
      product_name: prod.name,
      product_image: prod.image_url,
      size: item.size,
      quantity: item.quantity,
      price: itemPrice,
    });
  }

  // 4. Auto-apply First Order Discount if eligible
  // Check orders count
  const { count: ordersCount, error: ordersCountError } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .neq('status', 'Cancelled');

  if (ordersCountError) {
    res.status(500).json({ error: ordersCountError.message });
    return;
  }

  const isFirstOrder = (ordersCount ?? 0) === 0;
  let appliedCoupon = requestedCoupon;

  if (isFirstOrder && !appliedCoupon) {
    appliedCoupon = 'FIRST5'; // Auto-apply FIRST5 code
  }

  // 5. Calculate Discount
  let discount = 0;
  let couponDetails: any = null;

  if (appliedCoupon) {
    const { data: coupon } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', appliedCoupon)
      .maybeSingle();

    if (coupon) {
      const isExpired = coupon.expiry_date && new Date(coupon.expiry_date) < new Date();
      const limitReached = coupon.usage_limit && coupon.usage_count >= coupon.usage_limit;
      const minMet = subtotal >= Number(coupon.min_amount);

      if (!isExpired && !limitReached && minMet) {
        couponDetails = coupon;
        if (coupon.discount_type === 'percentage') {
          discount = (subtotal * Number(coupon.discount_value)) / 100;
          if (coupon.max_discount && discount > Number(coupon.max_discount)) {
            discount = Number(coupon.max_discount);
          }
        } else if (coupon.discount_type === 'fixed') {
          discount = Number(coupon.discount_value);
          if (discount > subtotal) discount = subtotal;
        }
      }
    }
  }

  // 6. Calculate Shipping
  let shipping = 99;
  if (subtotal >= 1500 || (couponDetails && couponDetails.code === 'FREESHIP')) {
    shipping = 0;
  }

  const total = subtotal + shipping - Math.round(discount);

  // 7. Insert Order
  const { data: order, error: insertOrderError } = await supabase
    .from('orders')
    .insert({
      user_id: userId,
      customer_name: customerName,
      customer_phone: customerPhone,
      customer_email: userEmail,
      address,
      area,
      city,
      pin,
      coupon: couponDetails?.code || null,
      notes,
      subtotal,
      shipping,
      discount: Math.round(discount),
      total,
      status: 'Pending',
    })
    .select('*')
    .single();

  if (insertOrderError) {
    res.status(500).json({ error: insertOrderError.message });
    return;
  }

  // 8. Insert Order Items
  const itemsWithOrderId = orderItemsPayload.map((item) => ({
    ...item,
    order_id: order.id,
  }));

  const { error: insertItemsError } = await supabase
    .from('order_items')
    .insert(itemsWithOrderId);

  if (insertItemsError) {
    // Attempt rollback of order
    await supabase.from('orders').delete().eq('id', order.id);
    res.status(500).json({ error: insertItemsError.message });
    return;
  }

  // 9. Increment Coupon usage if applied
  if (couponDetails) {
    await supabase
      .from('coupons')
      .update({ usage_count: couponDetails.usage_count + 1 })
      .eq('id', couponDetails.id);
  }

  // 10. Clear Cart
  await supabase
    .from('cart')
    .delete()
    .eq('user_id', userId);

  res.status(201).json({
    success: true,
    order: {
      ...order,
      items: itemsWithOrderId,
    },
  });
});
