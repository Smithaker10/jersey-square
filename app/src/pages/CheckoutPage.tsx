import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Send, Sparkles, Ticket } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { createOrder, fetchOrders } from '@/lib/api/orders';
import { validateCoupon } from '@/lib/api/coupons';
import { siteConfig } from '@/config/site';

export function CheckoutPage() {
  const navigate = useNavigate();
  const { items, clear } = useCartStore();
  const { profile, user } = useAuthStore();

  const [submitting, setSubmitting] = useState(false);
  const [successOrder, setSuccessOrder] = useState<any>(null);
  const [estimatedDelivery, setEstimatedDelivery] = useState('');

  // Delivery Form
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [area, setArea] = useState('');
  const [city, setCity] = useState('');
  const [pin, setPin] = useState('');
  const [notes, setNotes] = useState('');
  const [couponCode, setCouponCode] = useState('');

  useEffect(() => {
    if (profile) {
      if (!fullName) setFullName(profile.fullName || '');
      if (!phone) setPhone(profile.phone || '');
    }
  }, [profile]);

  // Coupon state
  const [validating, setValidating] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [isFirstOrder, setIsFirstOrder] = useState(false);

  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  // Check if first order on page load to apply FIRST5 discount
  useEffect(() => {
    if (!user) return;
    // Fetch orders count on load
    fetchOrders()
      .then((data) => {
        const orderCount = (data.orders ?? []).filter((o: any) => o.status !== 'Cancelled').length;
        if (orderCount === 0) {
          setIsFirstOrder(true);
          // Auto validate FIRST5
          handleValidateCoupon('FIRST5');
        }
      })
      .catch((err) => console.error(err));
  }, [user]);

  const handleValidateCoupon = async (code = couponCode) => {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return;

    setValidating(true);
    setCouponError(null);
    try {
      const result = await validateCoupon(trimmed, subtotal);
      setAppliedCoupon(result);
      setCouponCode(trimmed);
    } catch (err: any) {
      setCouponError(err.message || 'Invalid coupon code');
      setAppliedCoupon(null);
    } finally {
      setValidating(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError(null);
    // If they qualify for first order and just removed manual coupon, re-apply FIRST5
    if (isFirstOrder) {
      handleValidateCoupon('FIRST5');
    }
  };

  // Calculate discount & shipping
  const discountAmount = appliedCoupon ? appliedCoupon.discountAmount : 0;
  const isFreeShip = subtotal >= 1500 || (appliedCoupon && appliedCoupon.code === 'FREESHIP');
  const shipping = isFreeShip ? 0 : 99;
  const total = Math.max(0, subtotal + shipping - discountAmount);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;

    setSubmitting(true);
    try {
      const orderPayload = {
        fullName: fullName.trim() || undefined,
        phone: phone.trim() || undefined,
        address,
        area: area.trim() || undefined,
        city,
        pin,
        coupon: appliedCoupon?.code || undefined,
        notes: notes.trim() || undefined,
      };

      const result = await createOrder(orderPayload);
      const createdOrder = result.order;

      // 1. Estimate Delivery Range
      const today = new Date();
      const minDate = new Date(today);
      minDate.setDate(today.getDate() + 5);
      const maxDate = new Date(today);
      maxDate.setDate(today.getDate() + 7);
      
      const format = (d: Date) => d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
      const estRange = `${format(minDate)} to ${format(maxDate)}`;
      setEstimatedDelivery(estRange);

      // 2. Set success state to show confirmation modal
      setSuccessOrder(createdOrder);

      // 3. Clear shopping cart
      clear();
    } catch (err: any) {
      alert(err.message || 'Failed to place order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleWhatsAppRedirect = () => {
    if (!successOrder) return;

    // Generate formatted WhatsApp message
    const lines = [
      `Hello Jersey Square 👋`,
      `🆔 Order #JS10${successOrder.id}`,
      ``,
      `👤 Customer`,
      `${successOrder.customer_name}`,
      ``,
      `📞 WhatsApp`,
      `${successOrder.customer_phone}`,
      ``,
      `📧 Email`,
      `${successOrder.customer_email}`,
      `━━━━━━━━━━━━━━`,
      ``,
      `🛒 Items`,
    ];

    successOrder.items.forEach((item: any) => {
      lines.push(`• ${item.product_name}`);
      lines.push(`  Size: ${item.size}`);
      lines.push(`  Qty: ${item.quantity}`);
      lines.push(`  ₹${item.price * item.quantity}`);
      lines.push(``);
    });

    lines.push(`━━━━━━━━━━━━━━`);
    lines.push(``);
    lines.push(`Delivery Address`);
    lines.push(successOrder.address);
    if (successOrder.area) lines.push(successOrder.area);
    lines.push(successOrder.city);
    lines.push(successOrder.pin);
    lines.push(``);
    lines.push(`━━━━━━━━━━━━━━`);
    lines.push(``);

    if (successOrder.coupon) {
      lines.push(`Coupon`);
      lines.push(successOrder.coupon);
      lines.push(``);
    }

    if (successOrder.notes) {
      lines.push(`Order Notes`);
      lines.push(successOrder.notes);
      lines.push(``);
      lines.push(`━━━━━━━━━━━━━━`);
      lines.push(``);
    }

    lines.push(`Subtotal : ₹${successOrder.subtotal}`);
    lines.push(`Shipping : ₹${successOrder.shipping}`);
    lines.push(`Discount : ₹${successOrder.discount}`);
    lines.push(`Total : ₹${successOrder.total}`);
    lines.push(``);
    lines.push(`Thank you ❤️`);

    const message = lines.join('\n');
    const encoded = encodeURIComponent(message);
    
    // Redirect
    window.open(`${siteConfig.whatsappUrl}?text=${encoded}`, '_blank');
    
    // Navigate user to order tracking page
    navigate(`/profile`);
  };

  if (items.length === 0 && !successOrder) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 pt-[100px] text-center">
        <h2 className="text-xl font-bold text-[#1a1a1a]">Checkout is not available</h2>
        <p className="mt-2 text-sm text-gray-500">Your cart is empty. Please add items to checkout.</p>
        <Link to="/" className="mt-4 text-sm text-[#1B2A4A] underline">
          Back to catalog
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] pt-[120px] pb-16 relative">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
        <Link
          to="/cart"
          className="mb-6 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[#1a1a1a]"
        >
          <ArrowLeft size={16} />
          Back to cart
        </Link>

        <h1 className="text-2xl font-black tracking-tight text-[#1B2A4A] uppercase">
          Delivery Details
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Enter your shipment info. No online payment required; confirm your order on WhatsApp.
        </p>

        <div className="mt-8 grid gap-8 lg:grid-cols-3">
          {/* Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-white bg-white/70 p-6 shadow-sm backdrop-blur-md">
              <h2 className="text-base font-bold text-[#1B2A4A] uppercase tracking-wider">
                Shipping Information
              </h2>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-[#1a1a1a] outline-none focus:border-[#1B2A4A]"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    WhatsApp Number
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="WhatsApp Number"
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-[#1a1a1a] outline-none focus:border-[#1B2A4A]"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Street Address *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Flat No, House No, Building Name"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#1B2A4A]"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-1.5 sm:col-span-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Area / Locality
                  </label>
                  <input
                    type="text"
                    placeholder="Area / Locality"
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#1B2A4A]"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    City *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="City"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#1B2A4A]"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    PIN Code *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="PIN Code"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#1B2A4A]"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Order Notes (optional)
                </label>
                <textarea
                  rows={3}
                  placeholder="Leave delivery notes here..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#1B2A4A]"
                />
              </div>

              <button
                type="submit"
                disabled={submitting || items.length === 0}
                className="mt-6 flex w-full items-center justify-center gap-2.5 rounded-xl bg-[#1B2A4A] py-3.5 text-sm font-semibold text-white shadow-lg transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-50"
              >
                {submitting ? 'Placing Order…' : 'Place Order & Get Receipt'}
                <Send size={16} />
              </button>
            </form>
          </div>

          {/* Right Pane: Summary & Coupons */}
          <div className="space-y-6">
            {/* Coupon Code Card */}
            <div className="rounded-xl border border-white bg-white/70 p-6 shadow-sm backdrop-blur-md">
              <h3 className="text-sm font-bold text-[#1B2A4A] uppercase tracking-wider">
                Coupons & Discounts
              </h3>

              {!appliedCoupon ? (
                <div className="mt-3 flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
                      <Ticket size={16} />
                    </span>
                    <input
                      type="text"
                      placeholder="Enter coupon code"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-xs font-semibold uppercase outline-none focus:border-[#1B2A4A]"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleValidateCoupon()}
                    disabled={validating || !couponCode.trim()}
                    className="rounded-xl bg-gray-900 px-4 py-2.5 text-xs font-semibold text-white transition-all hover:bg-black disabled:opacity-50"
                  >
                    Apply
                  </button>
                </div>
              ) : (
                <div className="mt-3 flex items-center justify-between rounded-xl bg-[#1B2A4A]/5 border border-[#1B2A4A]/10 px-4 py-3">
                  <div>
                    <span className="text-xs font-bold text-[#1B2A4A]">
                      {appliedCoupon.code}
                    </span>
                    <span className="ml-2 rounded bg-emerald-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                      APPLIED
                    </span>
                    <p className="text-[10px] text-gray-500 mt-0.5">
                      {appliedCoupon.discountType === 'percentage' 
                        ? `Save ${appliedCoupon.discountValue}% (up to ₹${appliedCoupon.maxDiscount || '∞'})` 
                        : `₹${appliedCoupon.discountValue} Flat Discount`}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={removeCoupon}
                    className="text-xs font-bold text-rose-500 hover:underline"
                  >
                    Remove
                  </button>
                </div>
              )}

              {couponError && (
                <p className="mt-2 text-xs font-medium text-rose-600">{couponError}</p>
              )}

              {isFirstOrder && !appliedCoupon && (
                <div className="mt-3 flex items-center gap-1.5 rounded-lg bg-amber-50 border border-amber-200 p-2.5 text-[11px] font-medium text-amber-800">
                  <Sparkles size={14} className="shrink-0" />
                  <span>First Order? Auto-applying code <span className="font-bold">FIRST5</span>.</span>
                </div>
              )}
            </div>

            {/* Order Review List */}
            <div className="rounded-xl border border-white bg-white/70 p-6 shadow-sm backdrop-blur-md">
              <h3 className="text-sm font-bold text-[#1B2A4A] uppercase tracking-wider">
                Your Order
              </h3>

              <div className="mt-4 max-h-[220px] overflow-y-auto pr-1 space-y-3.5 border-b border-gray-100 pb-4">
                {items.map((item) => (
                  <div key={`${item.product.id}-${item.size}`} className="flex gap-3 text-xs">
                    <div className="aspect-[3/4] h-14 shrink-0 overflow-hidden rounded bg-gray-50 p-1 flex items-center justify-center border border-gray-100">
                      <img src={item.product.image} className="h-full w-full object-contain" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-800 line-clamp-1">
                        {item.product.title}
                      </h4>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        Size: <span className="font-bold">{item.size}</span> · Qty: <span className="font-bold">{item.quantity}</span>
                      </p>
                      <p className="font-semibold text-[#1B2A4A] mt-1">
                        ₹{(item.product.price * item.quantity).toLocaleString('en-IN')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="mt-4 space-y-2.5 border-b border-gray-100 pb-4 text-xs text-gray-600">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold text-gray-800">₹{subtotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping Fee</span>
                  {shipping === 0 ? (
                    <span className="font-semibold text-emerald-600">FREE</span>
                  ) : (
                    <span className="font-semibold text-gray-800">₹{shipping}</span>
                  )}
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-medium">
                    <span>Discount</span>
                    <span>- ₹{discountAmount.toLocaleString('en-IN')}</span>
                  </div>
                )}
              </div>

              <div className="mt-4 flex justify-between text-sm font-bold text-[#1a1a1a]">
                <span>Grand Total</span>
                <span className="text-base text-[#1B2A4A]">₹{total.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {successOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl text-center"
            >
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <Sparkles size={28} />
              </div>
              <h2 className="mt-4 text-xl font-bold text-[#1B2A4A]">
                Order Created Successfully!
              </h2>
              <p className="mt-2 text-xs text-gray-500 uppercase tracking-wider">
                Order ID: #JS10{successOrder.id}
              </p>
              
              <div className="mt-4 rounded-xl bg-gray-50 border border-gray-100 p-4 text-left text-xs space-y-2 text-gray-600">
                <p>
                  📅 <span className="font-semibold">Est. Delivery:</span> {estimatedDelivery}
                </p>
                <p>
                  📦 <span className="font-semibold">Items Count:</span> {successOrder.items.length} jerseys
                </p>
                <p>
                  💰 <span className="font-semibold">Final Price:</span> ₹{successOrder.total}
                </p>
              </div>

              <p className="mt-4 text-xs text-gray-500 leading-relaxed px-2">
                Clicking the button below will open WhatsApp with your pre-filled receipt details. Send the message to confirm your order with us!
              </p>

              <button
                type="button"
                onClick={handleWhatsAppRedirect}
                className="mt-6 flex w-full items-center justify-center gap-2.5 rounded-xl bg-[#25D366] py-3.5 text-sm font-semibold text-white shadow-lg hover:brightness-110 active:scale-[0.98]"
              >
                Send Message & Confirm Order
                <Send size={16} />
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
