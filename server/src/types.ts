export interface DbProduct {
  id: number;
  name: string;
  description: string | null;
  sport: string;
  category: string;
  category_label: string | null;
  team: string | null;
  player: string | null;
  price: number;
  old_price: number | null;
  stock_status: string;
  image_url: string | null;
  discount: string | null;
  tags: string[] | null;
  popular_score: number | null;
  is_visible: boolean | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface DbCategory {
  id: string;
  title: string;
  subtitle: string;
  sort_order: number;
}

export interface Product {
  id: number;
  name: string;
  category: string;
  categoryLabel: string;
  price: number;
  oldPrice: number;
  image: string;
  discount: string;
}

export interface Category {
  id: string;
  title: string;
  subtitle: string;
  products: Product[];
}

export interface SiteSettings {
  brandName: string;
  tagline: string;
  email: string;
  phone: string;
  instagramUrl: string;
  instagramHandle: string;
  whatsappUrl: string;
  whatsappGroupUrl: string;
}
