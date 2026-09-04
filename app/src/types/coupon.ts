export interface Coupon {
  id: number;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minAmount: number;
  maxDiscount: number | null;
  usageLimit: number | null;
  usageCount: number;
  expiryDate: string | null;
  createdAt: string;
}

export interface CouponValidationResponse {
  valid: boolean;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minAmount: number;
  maxDiscount: number | null;
  discountAmount: number;
  error?: string;
}
