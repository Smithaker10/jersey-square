export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface ProductRow {
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
  tags: string[];
  popular_score: number | null;
  is_visible: boolean | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface ProductInsert {
  id?: number;
  name: string;
  description?: string | null;
  sport: string;
  category: string;
  category_label?: string | null;
  team?: string | null;
  player?: string | null;
  price: number;
  old_price?: number | null;
  stock_status: string;
  image_url?: string | null;
  discount?: string | null;
  tags: string[];
  popular_score?: number | null;
  is_visible?: boolean | null;
  sort_order?: number;
  created_at?: string;
  updated_at?: string;
}

export interface ProductUpdate {
  id?: number;
  name?: string;
  description?: string | null;
  sport?: string;
  category?: string;
  category_label?: string | null;
  team?: string | null;
  player?: string | null;
  price?: number;
  old_price?: number | null;
  stock_status?: string;
  image_url?: string | null;
  discount?: string | null;
  tags?: string[];
  popular_score?: number | null;
  is_visible?: boolean | null;
  sort_order?: number;
  created_at?: string;
  updated_at?: string;
}

export interface UserRow {
  id: string;
  full_name: string | null;
  email: string;
  phone: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserInsert {
  id: string;
  full_name?: string | null;
  email: string;
  phone?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface UserUpdate {
  id?: string;
  full_name?: string | null;
  email?: string;
  phone?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface CouponRow {
  id: number;
  code: string;
  discount_type: string;
  discount_value: number;
  min_amount: number;
  max_discount: number | null;
  usage_limit: number | null;
  usage_count: number;
  expiry_date: string | null;
  created_at: string;
}

export interface CouponInsert {
  id?: number;
  code: string;
  discount_type: string;
  discount_value: number;
  min_amount: number;
  max_discount?: number | null;
  usage_limit?: number | null;
  usage_count?: number;
  expiry_date?: string | null;
  created_at?: string;
}

export interface CouponUpdate {
  id?: number;
  code?: string;
  discount_type?: string;
  discount_value?: number;
  min_amount?: number;
  max_discount?: number | null;
  usage_limit?: number | null;
  usage_count?: number;
  expiry_date?: string | null;
  created_at?: string;
}

export interface CartRow {
  id: number;
  user_id: string;
  product_id: number;
  size: string;
  quantity: number;
  created_at: string;
}

export interface CartInsert {
  id?: number;
  user_id: string;
  product_id: number;
  size: string;
  quantity: number;
  created_at?: string;
}

export interface CartUpdate {
  id?: number;
  user_id?: string;
  product_id?: number;
  size?: string;
  quantity?: number;
  created_at?: string;
}

export interface WishlistRow {
  id: number;
  user_id: string;
  product_id: number;
  created_at: string;
}

export interface WishlistInsert {
  id?: number;
  user_id: string;
  product_id: number;
  created_at?: string;
}

export interface WishlistUpdate {
  id?: number;
  user_id?: string;
  product_id?: number;
  created_at?: string;
}

export interface OrderRow {
  id: number;
  user_id: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  address: string;
  area: string | null;
  city: string;
  pin: string;
  coupon: string | null;
  notes: string | null;
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  status: string;
  created_at: string;
}

export interface OrderInsert {
  id?: number;
  user_id: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  address: string;
  area?: string | null;
  city: string;
  pin: string;
  coupon?: string | null;
  notes?: string | null;
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  status?: string;
  created_at?: string;
}

export interface OrderUpdate {
  id?: number;
  user_id?: string;
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  address?: string;
  area?: string | null;
  city?: string;
  pin?: string;
  coupon?: string | null;
  notes?: string | null;
  subtotal?: number;
  shipping?: number;
  discount?: number;
  total?: number;
  status?: string;
  created_at?: string;
}

export interface OrderItemRow {
  id: number;
  order_id: number;
  product_id: number;
  product_name: string;
  product_image: string | null;
  size: string;
  quantity: number;
  price: number;
}

export interface OrderItemInsert {
  id?: number;
  order_id: number;
  product_id: number;
  product_name: string;
  product_image?: string | null;
  size: string;
  quantity: number;
  price: number;
}

export interface OrderItemUpdate {
  id?: number;
  order_id?: number;
  product_id?: number;
  product_name?: string;
  product_image?: string | null;
  size?: string;
  quantity?: number;
  price?: number;
}

export interface CategoryRow {
  id: string;
  title: string;
  subtitle: string;
  sort_order: number;
  created_at: string;
  sport: string;
}

export interface Database {
  public: {
    Tables: {
      products: {
        Row: ProductRow;
        Insert: ProductInsert;
        Update: ProductUpdate;
      };
      categories: {
        Row: CategoryRow;
        Insert: Omit<CategoryRow, 'created_at'> & { created_at?: string };
        Update: Partial<CategoryRow>;
      };
      users: {
        Row: UserRow;
        Insert: UserInsert;
        Update: UserUpdate;
      };
      coupons: {
        Row: CouponRow;
        Insert: CouponInsert;
        Update: CouponUpdate;
      };
      cart: {
        Row: CartRow;
        Insert: CartInsert;
        Update: CartUpdate;
      };
      wishlist: {
        Row: WishlistRow;
        Insert: WishlistInsert;
        Update: WishlistUpdate;
      };
      orders: {
        Row: OrderRow;
        Insert: OrderInsert;
        Update: OrderUpdate;
      };
      order_items: {
        Row: OrderItemRow;
        Insert: OrderItemInsert;
        Update: OrderItemUpdate;
      };
    };
    Functions: {
      search_products: {
        Args: { search_query: string; sport_filter?: string | null };
        Returns: ProductRow[];
      };
    };
  };
}
