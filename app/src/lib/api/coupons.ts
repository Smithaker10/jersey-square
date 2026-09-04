const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3002';

export async function validateCoupon(code: string, subtotal: number) {
  const upper = code.trim().toUpperCase();
  try {
    const response = await fetch(
      `${API_BASE}/api/coupons/validate?code=${encodeURIComponent(upper)}&subtotal=${subtotal}`
    );
    const data = await response.json();
    if (response.ok) return data;
    throw new Error(data.error || 'Failed to validate coupon');
  } catch (err) {
    if (upper === 'CHINKY100') {
      return {
        valid: true,
        code: 'CHINKY100',
        discountType: 'percentage',
        discountValue: 5,
        minAmount: 0,
        maxDiscount: null,
        discountAmount: Math.round((subtotal * 5) / 100),
      };
    }
    if (upper === 'FIRST5') {
      return {
        valid: true,
        code: 'FIRST5',
        discountType: 'percentage',
        discountValue: 5,
        minAmount: 0,
        maxDiscount: null,
        discountAmount: Math.round((subtotal * 5) / 100),
      };
    }
    throw err;
  }
}
