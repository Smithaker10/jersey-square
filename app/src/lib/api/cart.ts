import { useAuthStore } from '@/store/authStore';

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

export async function fetchCart() {
  const response = await fetch(`${API_BASE}/api/cart`, {
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch cart');
  }

  return response.json();
}

export async function addToCart(productId: number, size: string, quantity: number) {
  const response = await fetch(`${API_BASE}/api/cart`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ productId, size, quantity }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to add item to cart');
  }

  return response.json();
}

export async function updateCartItem(id: number, quantity?: number, size?: string) {
  const response = await fetch(`${API_BASE}/api/cart/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify({ quantity, size }),
  });

  if (!response.ok) {
    throw new Error('Failed to update cart item');
  }

  return response.json();
}

export async function deleteCartItem(id: number) {
  const response = await fetch(`${API_BASE}/api/cart/${id}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to delete cart item');
  }

  return response.json();
}

export async function syncCart(items: Array<{ productId: number; size: string; quantity: number }>) {
  const response = await fetch(`${API_BASE}/api/cart/sync`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ items }),
  });

  if (!response.ok) {
    throw new Error('Failed to sync cart');
  }

  return response.json();
}
