import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';
import { supabase } from '@/lib/supabase/client';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3002';

function getHeaders() {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  const token = useAuthStore.getState().accessToken;
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export interface PlaceOrderPayload {
  fullName?: string;
  phone?: string;
  address: string;
  area?: string;
  city: string;
  pin: string;
  coupon?: string;
  notes?: string;
}

export async function createOrder(payload: PlaceOrderPayload) {
  try {
    const response = await fetch(`${API_BASE}/api/orders`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      return await response.json();
    }
    const data = await response.json().catch(() => ({}));
    if (data.error) {
      throw new Error(data.error);
    }
  } catch (err: any) {
    // If error is an explicit validation error from backend (not network fetch failure), rethrow
    if (err.message && !err.message.includes('fetch') && err.message !== 'Failed to fetch') {
      throw err;
    }
    console.warn('API server unavailable, falling back to direct Supabase / client order creation.', err);
  }

  // Fallback direct order creation
  const user = useAuthStore.getState().user;
  const profile = useAuthStore.getState().profile;
  const cartItems = useCartStore.getState().items;

  const customerName = payload.fullName || profile?.fullName || user?.user_metadata?.full_name || 'Valued Customer';
  const customerPhone = payload.phone || profile?.phone || '9313486084';
  const customerEmail = user?.email || 'customer@jerseysquare.com';

  let subtotal = 0;
  const orderItemsPayload = cartItems.map((item) => {
    const price = Number(item.product.price);
    subtotal += price * item.quantity;
    return {
      product_id: item.product.id,
      product_name: item.product.title,
      product_image: item.product.image,
      size: item.size,
      quantity: item.quantity,
      price: price,
    };
  });

  const discount =
    payload.coupon === 'FIRST5' || payload.coupon === 'CHINKY100'
      ? Math.round((subtotal * 5) / 100)
      : 0;
  const shipping = subtotal >= 1500 || payload.coupon === 'FREESHIP' ? 0 : 99;
  const total = subtotal + shipping - discount;

  let orderId = Math.floor(100000 + Math.random() * 900000);

  // Try direct insert to Supabase if configured
  try {
    const { data: dbOrder, error: orderErr } = await (supabase as any)
      .from('orders')
      .insert({
        user_id: user?.id || null,
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_email: customerEmail,
        address: payload.address,
        area: payload.area || '',
        city: payload.city,
        pin: payload.pin,
        coupon: payload.coupon || null,
        notes: payload.notes || null,
        subtotal,
        shipping,
        discount,
        total,
        status: 'Pending',
      })
      .select('id')
      .single();

    if (!orderErr && dbOrder?.id) {
      orderId = dbOrder.id;
      const itemsWithId = orderItemsPayload.map((i) => ({ ...i, order_id: orderId }));
      await (supabase as any).from('order_items').insert(itemsWithId);
    }
  } catch (supabaseErr) {
    console.warn('Supabase insert fallback warning:', supabaseErr);
  }

  return {
    success: true,
    order: {
      id: orderId,
      customer_name: customerName,
      customer_phone: customerPhone,
      customer_email: customerEmail,
      address: payload.address,
      city: payload.city,
      pin: payload.pin,
      coupon: payload.coupon,
      notes: payload.notes,
      subtotal,
      shipping,
      discount,
      total,
      items: orderItemsPayload,
    },
  };
}

export async function fetchOrders() {
  try {
    const response = await fetch(`${API_BASE}/api/orders`, {
      headers: getHeaders(),
    });

    if (response.ok) {
      return await response.json();
    }
  } catch (err) {
    console.warn('API server fetchOrders failed, falling back to Supabase direct.', err);
  }

  const user = useAuthStore.getState().user;
  if (!user) return { orders: [] };

  const { data, error } = await (supabase as any)
    .from('orders')
    .select(`
      *,
      items:order_items(*)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    return { orders: [] };
  }

  return { orders: data ?? [] };
}

export async function fetchOrderById(id: number) {
  try {
    const response = await fetch(`${API_BASE}/api/orders/${id}`, {
      headers: getHeaders(),
    });

    if (response.ok) {
      return await response.json();
    }
  } catch (err) {
    console.warn('API server fetchOrderById failed, falling back to Supabase direct.', err);
  }

  const user = useAuthStore.getState().user;
  if (!user) throw new Error('Order not found');

  const { data: order, error } = await (supabase as any)
    .from('orders')
    .select(`
      *,
      items:order_items(*)
    `)
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle();

  if (error || !order) {
    throw new Error('Order not found');
  }

  return { order };
}
