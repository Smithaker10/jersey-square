import { Router } from 'express';
import { supabase } from '../lib/supabase.js';

export const couponsRouter = Router();

// Validate coupon code
couponsRouter.get('/validate', async (req, res) => {
  const code = String(req.query.code ?? '').trim().toUpperCase();
  const subtotal = Number(req.query.subtotal ?? 0);

  if (!code) {
    res.status(400).json({ error: 'Coupon code is required' });
    return;
  }

  // Fetch coupon from DB
  const { data: coupon, error } = await supabase
    .from('coupons')
    .select('*')
    .eq('code', code)
    .maybeSingle();

  if (error || !coupon) {
    if (code === 'CHINKY100') {
      const discountAmount = Math.round((subtotal * 5) / 100);
      res.json({
        valid: true,
        code: 'CHINKY100',
        discountType: 'percentage',
        discountValue: 5,
        minAmount: 0,
        maxDiscount: null,
        discountAmount,
      });
      return;
    }
    if (code === 'FIRST5') {
      const discountAmount = Math.round((subtotal * 5) / 100);
      res.json({
        valid: true,
        code: 'FIRST5',
        discountType: 'percentage',
        discountValue: 5,
        minAmount: 0,
        maxDiscount: null,
        discountAmount,
      });
      return;
    }
    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }
    res.status(400).json({ error: 'Invalid coupon code' });
    return;
  }

  // Check Expiry
  if (coupon.expiry_date && new Date(coupon.expiry_date) < new Date()) {
    res.status(400).json({ error: 'This coupon has expired' });
    return;
  }

  // Check Usage Limit
  if (coupon.usage_limit && coupon.usage_count >= coupon.usage_limit) {
    res.status(400).json({ error: 'This coupon has reached its usage limit' });
    return;
  }

  // Check Minimum Order Amount
  if (subtotal < Number(coupon.min_amount)) {
    res.status(400).json({
      error: `Minimum order amount of ₹${Number(coupon.min_amount)} is required for this coupon`
    });
    return;
  }

  // Calculate discount amount
  let discountAmount = 0;
  if (coupon.discount_type === 'percentage') {
    discountAmount = (subtotal * Number(coupon.discount_value)) / 100;
    if (coupon.max_discount && discountAmount > Number(coupon.max_discount)) {
      discountAmount = Number(coupon.max_discount);
    }
  } else if (coupon.discount_type === 'fixed') {
    discountAmount = Number(coupon.discount_value);
    if (discountAmount > subtotal) {
      discountAmount = subtotal;
    }
  }

  res.json({
    valid: true,
    code: coupon.code,
    discountType: coupon.discount_type,
    discountValue: Number(coupon.discount_value),
    minAmount: Number(coupon.min_amount),
    maxDiscount: coupon.max_discount ? Number(coupon.max_discount) : null,
    discountAmount: Math.round(discountAmount)
  });
});
