import type { Category } from '@/data/products';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3002';

export interface SiteSettingsResponse {
  brandName: string;
  tagline: string;
  email: string;
  phone: string;
  instagramUrl: string;
  instagramHandle: string;
  whatsappUrl: string;
  whatsappGroupUrl: string;
}

export async function fetchCatalog(): Promise<Category[]> {
  const response = await fetch(`${API_BASE}/api/catalog`);

  if (!response.ok) {
    throw new Error('Failed to load catalog');
  }

  const data = (await response.json()) as { categories: Category[] };
  return data.categories;
}

export async function fetchSiteSettings(): Promise<SiteSettingsResponse> {
  const response = await fetch(`${API_BASE}/api/settings`);

  if (!response.ok) {
    throw new Error('Failed to load site settings');
  }

  return response.json() as Promise<SiteSettingsResponse>;
}

export async function submitStylistInquiry(payload: {
  name?: string;
  email?: string;
  message: string;
}): Promise<void> {
  const response = await fetch(`${API_BASE}/api/inquiries`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error('Failed to submit inquiry');
  }
}
