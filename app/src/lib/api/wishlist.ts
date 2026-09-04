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

export async function fetchWishlist() {
  const response = await fetch(`${API_BASE}/api/wishlist`, {
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch wishlist');
  }

  return response.json();
}

export async function toggleWishlist(productId: number) {
  const response = await fetch(`${API_BASE}/api/wishlist`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ productId }),
  });

  if (!response.ok) {
    throw new Error('Failed to toggle wishlist item');
  }

  return response.json();
}
