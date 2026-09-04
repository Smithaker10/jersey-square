export interface OrderItem {
  id: number;
  orderId: number;
  productId: number | null;
  productName: string;
  productImage: string | null;
  size: string;
  quantity: number;
  price: number;
}

export type OrderStatus = 'Pending' | 'Confirmed' | 'Packed' | 'Shipped' | 'Delivered' | 'Cancelled';

export interface Order {
  id: number;
  userId: string | null;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
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
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
  items?: OrderItem[];
}
