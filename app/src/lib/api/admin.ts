const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3002';

async function readApiError(response: Response, fallback: string) {
  const body = await response.json().catch(() => null);

  if (!body) return fallback;

  if (typeof body.error === 'string') return body.error;

  if (body.error && typeof body.error === 'object') {
    return Object.values(body.error)
      .flat()
      .filter((value): value is string => typeof value === 'string')
      .join(', ') || fallback;
  }

  return fallback;
}

export interface AdminProductPayload {
  name: string;
  sport: string;
  categoryId: string;
  categoryLabel: string;
  team: string;
  player?: string;
  description: string;
  stockStatus: 'in_stock' | 'low_stock' | 'out_of_stock' | 'preorder';
  price: number;
  oldPrice: number;
  discount: string;
  tags: string[];
  popular: number;
  image: string;
  sortOrder?: number;
}

export interface AdminProduct extends AdminProductPayload {
  id: number;
  createdAt: string;
}

export interface CreateProductPayload {
  name: string;
  sport: string;
  categoryId: string;
  categoryLabel: string;
  team: string;
  player?: string;
  price: number;
  oldPrice: number;
  discount: string;
  tags: string[];
  popular: number;
  image: string;
  sortOrder?: number;
}

export async function uploadProductImage(file: File, adminSecret: string): Promise<string> {
  const formData = new FormData();
  formData.append('image', file);

  const response = await fetch(`${API_BASE}/api/admin/upload`, {
    method: 'POST',
    headers: { 'x-admin-secret': adminSecret },
    body: formData,
  });

  if (!response.ok) {
    throw new Error(await readApiError(response, 'Image upload failed'));
  }

  const data = (await response.json()) as { url: string };
  return data.url;
}

export async function fetchAdminProducts(adminSecret: string): Promise<AdminProduct[]> {
  const response = await fetch(`${API_BASE}/api/admin/products`, {
    headers: { 'x-admin-secret': adminSecret },
  });

  if (!response.ok) {
    throw new Error(await readApiError(response, 'Failed to load admin products'));
  }

  const data = (await response.json()) as { products: AdminProduct[] };
  return data.products;
}

export async function createProduct(
  payload: AdminProductPayload,
  adminSecret: string,
): Promise<AdminProduct> {
  const response = await fetch(`${API_BASE}/api/admin/products`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-secret': adminSecret,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await readApiError(response, 'Failed to create product'));
  }

  const data = (await response.json()) as { product: AdminProduct };
  return data.product;
}

export async function updateProduct(
  id: number,
  payload: AdminProductPayload,
  adminSecret: string,
): Promise<AdminProduct> {
  const response = await fetch(`${API_BASE}/api/admin/products/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-secret': adminSecret,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await readApiError(response, 'Failed to update product'));
  }

  const data = (await response.json()) as { product: AdminProduct };
  return data.product;
}

export async function deleteProduct(id: number, adminSecret: string): Promise<void> {
  const response = await fetch(`${API_BASE}/api/admin/products/${id}`, {
    method: 'DELETE',
    headers: { 'x-admin-secret': adminSecret },
  });

  if (!response.ok && response.status !== 204) {
    throw new Error(await readApiError(response, 'Failed to delete product'));
  }
}

// ================= NEW ADMIN ENDPOINTS =================

export async function fetchAdminOrders(adminSecret: string) {
  const response = await fetch(`${API_BASE}/api/admin/orders`, {
    headers: { 'x-admin-secret': adminSecret },
  });

  if (!response.ok) {
    throw new Error(await readApiError(response, 'Failed to load orders'));
  }

  return response.json();
}

export async function updateOrderStatus(orderId: number, status: string, adminSecret: string) {
  const response = await fetch(`${API_BASE}/api/admin/orders/${orderId}/status`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-secret': adminSecret,
    },
    body: JSON.stringify({ status }),
  });

  if (!response.ok) {
    throw new Error(await readApiError(response, 'Failed to update order status'));
  }

  return response.json();
}

export async function fetchAdminCustomers(adminSecret: string) {
  const response = await fetch(`${API_BASE}/api/admin/customers`, {
    headers: { 'x-admin-secret': adminSecret },
  });

  if (!response.ok) {
    throw new Error(await readApiError(response, 'Failed to load customers'));
  }

  return response.json();
}

export async function fetchAdminCoupons(adminSecret: string) {
  const response = await fetch(`${API_BASE}/api/admin/coupons`, {
    headers: { 'x-admin-secret': adminSecret },
  });

  if (!response.ok) {
    throw new Error(await readApiError(response, 'Failed to load coupons'));
  }

  return response.json();
}

export interface CouponPayload {
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minAmount: number;
  maxDiscount?: number | null;
  usageLimit?: number | null;
  expiryDate?: string | null;
}

export async function createCoupon(payload: CouponPayload, adminSecret: string) {
  const response = await fetch(`${API_BASE}/api/admin/coupons`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-secret': adminSecret,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await readApiError(response, 'Failed to create coupon'));
  }

  return response.json();
}

export async function updateCoupon(id: number, payload: CouponPayload, adminSecret: string) {
  const response = await fetch(`${API_BASE}/api/admin/coupons/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-secret': adminSecret,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await readApiError(response, 'Failed to update coupon'));
  }

  return response.json();
}

export async function deleteCoupon(id: number, adminSecret: string) {
  const response = await fetch(`${API_BASE}/api/admin/coupons/${id}`, {
    method: 'DELETE',
    headers: { 'x-admin-secret': adminSecret },
  });

  if (!response.ok && response.status !== 204) {
    throw new Error(await readApiError(response, 'Failed to delete coupon'));
  }
}

export async function fetchAdminAnalytics(adminSecret: string) {
  const response = await fetch(`${API_BASE}/api/admin/analytics`, {
    headers: { 'x-admin-secret': adminSecret },
  });

  if (!response.ok) {
    throw new Error(await readApiError(response, 'Failed to load analytics'));
  }

  return response.json();
}

