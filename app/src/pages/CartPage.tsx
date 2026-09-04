import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import { Minus, Plus, ShoppingBag, Ticket, Sparkles, MessageCircle, CheckCircle2 } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { createOrder, fetchOrders } from '@/lib/api/orders';
import { validateCoupon } from '@/lib/api/coupons';
import { siteConfig } from '@/config/site';

export function CartPage() {
  const navigate = useNavigate();
  const { items, updateQuantity, removeItem, loading, loadCart, clear } = useCartStore();
  const { user, profile } = useAuthStore();

  const [submitting, setSubmitting] = useState(false);
  const [isFirstOrder, setIsFirstOrder] = useState(false);

  // Form fields (editable for logged in users as well)
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [pin, setPin] = useState('');
  const [notes, setNotes] = useState('');

  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [validating, setValidating] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);

  // 1. Fetch Cart and check order count on load
  useEffect(() => {
    loadCart();

    if (user) {
      fetchOrders()
        .then((data) => {
          const orderCount = (data.orders ?? []).filter((o: any) => o.status !== 'Cancelled').length;
          setIsFirstOrder(orderCount === 0);
        })
        .catch((err) => console.error(err));
    }
  }, [user, loadCart]);

  // Pre-fill profile details
  useEffect(() => {
    if (profile) {
      if (!fullName) setFullName(profile.fullName || '');
      if (!phone) setPhone(profile.phone || '');
    }
  }, [profile]);

  const validItems = items.filter((item) => item && item.product);

  const subtotal = validItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  // Calculate discount & shipping
  let discountAmount = 0;
  if (appliedCoupon) {
    discountAmount = appliedCoupon.discountAmount;
  } else if (user && isFirstOrder) {
    discountAmount = Math.round(subtotal * 0.05);
  }

  const isFreeShip = subtotal >= 1500 || (appliedCoupon && appliedCoupon.code === 'FREESHIP');
  const shipping = subtotal === 0 ? 0 : isFreeShip ? 0 : 99;
  const total = Math.max(0, subtotal + shipping - discountAmount);

  const handleValidateCoupon = async (codeToValidate = couponCode) => {
    const trimmed = codeToValidate.trim().toUpperCase();
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
  };

  const buildWhatsAppMessage = () => {
    const lines: string[] = [
      `*🛒 NEW ORDER - JERSEY SQUARE*`,
      `━━━━━━━━━━━━━━━━━━━━━━`,
      `📦 *ITEMS ORDERED:*`,
    ];

    validItems.forEach((item, index) => {
      lines.push(
        `${index + 1}. *${item.product.title}*`,
        `   • Size: ${item.size}`,
        `   • Qty: ${item.quantity}`,
        `   • Price: ₹${(item.product.price * item.quantity).toLocaleString('en-IN')}`
      );
    });

    lines.push(
      ``,
      `━━━━━━━━━━━━━━━━━━━━━━`,
      `💰 *BILLING SUMMARY:*`,
      `• Items Subtotal: ₹${subtotal.toLocaleString('en-IN')}`,
      `• Shipping: ${shipping === 0 ? 'FREE' : `₹${shipping}`}`
    );

    if (discountAmount > 0) {
      const codeName = appliedCoupon?.code || (user && isFirstOrder ? 'FIRST5' : 'DISCOUNT');
      lines.push(`• Discount (${codeName}): -₹${discountAmount.toLocaleString('en-IN')}`);
    }

    const deliveryAddressStr = address.trim()
      ? `${address.trim()}${city.trim() ? `, ${city.trim()}` : ''}${pin.trim() ? ` - ${pin.trim()}` : ''}`
      : 'Will provide address in chat';

    lines.push(
      `*👉 TOTAL AMOUNT: ₹${total.toLocaleString('en-IN')}*`,
      ``,
      `━━━━━━━━━━━━━━━━━━━━━━`,
      `📍 *CUSTOMER & DELIVERY INFO:*`,
      `• Name: ${fullName.trim() || 'Customer (will share on WhatsApp)'}`,
      `• Phone: ${phone.trim() || 'Same as WhatsApp'}`,
      `• Delivery Address: ${deliveryAddressStr}`
    );

    if (notes.trim()) {
      lines.push(`• Notes: ${notes.trim()}`);
    }

    lines.push(
      `━━━━━━━━━━━━━━━━━━━━━━`,
      `_Hi Jersey Square! I want to place this order. Please confirm availability and share payment details. Thank you!_`
    );

    return lines.join('\n');
  };

  const getWhatsAppMessageText = () => {
    return buildWhatsAppMessage();
  };

  const [orderSuccess, setOrderSuccess] = useState<{
    total: number;
    itemCount: number;
    whatsappUrl: string;
  } | null>(null);

  const handleCheckoutSubmit = async () => {
    if (validItems.length === 0) return;

    setSubmitting(true);
    const message = buildWhatsAppMessage();
    const targetUrl = `${siteConfig.whatsappUrl}?text=${encodeURIComponent(message)}`;

    // Open WhatsApp directly
    window.open(targetUrl, '_blank', 'noopener,noreferrer');

    // Best-effort background order log (does not block WhatsApp or throw alerts)
    try {
      const orderPayload = {
        fullName: fullName.trim() || undefined,
        phone: phone.trim() || undefined,
        address: address.trim() || 'Shared on WhatsApp',
        area: '',
        city: city.trim() || 'Shared on WhatsApp',
        pin: pin.trim() || '000000',
        coupon: appliedCoupon?.code || (isFirstOrder ? 'FIRST5' : undefined),
        notes: notes.trim() || undefined,
      };
      createOrder(orderPayload).catch(() => {});
    } catch {
      // Ignore background logging errors
    }

    const currentTotal = total;
    const currentItemCount = validItems.reduce((sum, item) => sum + item.quantity, 0);

    // Set success modal state and clear cart
    setOrderSuccess({
      total: currentTotal,
      itemCount: currentItemCount,
      whatsappUrl: targetUrl,
    });
    clear();
    setSubmitting(false);
  };

  if (validItems.length === 0) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center bg-[#FAF9F6] px-4 pt-[100px] text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-stone-100 text-stone-400">
          <ShoppingBag size={28} />
        </div>
        <h2 className="mt-6 text-xl font-medium font-serif text-stone-855">Your cart is empty</h2>
        <p className="mt-2 text-sm text-stone-500 max-w-sm">
          Explore our latest premium jerseys to find your perfect fit!
        </p>
        <Link
          to="/"
          className="mt-6 rounded-full bg-stone-900 px-6 py-3 text-xs font-semibold uppercase tracking-wider text-white shadow transition-all hover:brightness-110"
        >
          Back to catalog
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-stone-800 pt-[120px] pb-20 font-sans">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
        
        {/* Breadcrumb */}
        <div className="mb-6 flex gap-2 text-xs uppercase tracking-wider text-stone-400 font-semibold">
          <Link to="/" className="hover:text-stone-750">Home</Link>
          <span>/</span>
          <span className="text-stone-700">Cart</span>
        </div>

        {/* Main Grid */}
        <div className="grid gap-12 lg:grid-cols-5 items-start">
          
          {/* Left Column: Cart Items + Delivery details */}
          <div className="lg:col-span-3 space-y-12">
            
            {/* Title */}
            <div>
              <h1 className="text-4xl font-serif text-stone-900 tracking-tight flex items-baseline gap-2">
                Your cart <span className="text-2xl text-stone-400 font-sans font-light">({validItems.length})</span>
              </h1>
            </div>

            {/* Cart Items list */}
            <div className="border-t border-stone-200/80 divide-y divide-stone-200/80">
              {validItems.map((item) => {
                const generatedSku = `${item.product.team.substring(0, 3).toUpperCase()}-${item.product.sport.substring(0, 1).toUpperCase()}-2026-${item.size}`;

                return (
                  <div
                    key={`${item.product.id}-${item.size}`}
                    className="py-6 flex items-start gap-4 sm:gap-6"
                  >
                    {/* Thumbnail */}
                    <div className="aspect-[3/4] w-20 shrink-0 overflow-hidden rounded bg-stone-100 p-2 flex items-center justify-center border border-stone-200/30 sm:w-24">
                      <img
                        src={item.product.image}
                        alt={item.product.title}
                        className="h-full w-full object-contain"
                      />
                    </div>

                    {/* Meta */}
                    <div className="flex-1 flex flex-col justify-between self-stretch">
                      <div>
                        <div className="flex justify-between items-start gap-4">
                          <h3 className="text-sm font-semibold text-stone-900 sm:text-base leading-snug font-serif">
                            {item.product.title}
                          </h3>
                          <span className="text-sm font-bold text-stone-900 shrink-0 font-serif">
                            ₹{(item.product.price * item.quantity).toLocaleString('en-IN')}
                          </span>
                        </div>
                        <p className="text-[11px] font-semibold text-stone-400 uppercase tracking-widest mt-1">
                          SKU: {generatedSku} · SIZE: {item.size}
                        </p>
                      </div>

                      {/* Quantity & Delete Row */}
                      <div className="flex items-center justify-between mt-4">
                        {/* Selector */}
                        <div className="flex items-center border border-stone-200 bg-white rounded-md px-1.5 py-0.5">
                          <button
                            type="button"
                            disabled={loading || item.quantity <= 1}
                            onClick={() => updateQuantity(item.product.id, item.size, item.quantity - 1)}
                            className="p-1 text-stone-400 hover:text-stone-700 disabled:opacity-40"
                          >
                            <Minus size={10} />
                          </button>
                          <span className="px-3 text-xs font-bold text-stone-800">{item.quantity}</span>
                          <button
                            type="button"
                            disabled={loading}
                            onClick={() => updateQuantity(item.product.id, item.size, item.quantity + 1)}
                            className="p-1 text-stone-400 hover:text-stone-700"
                          >
                            <Plus size={10} />
                          </button>
                        </div>

                        {/* Remove */}
                        <button
                          type="button"
                          disabled={loading}
                          onClick={() => removeItem(item.product.id, item.size)}
                          className="text-xs font-bold text-rose-500 hover:underline hover:text-rose-600 uppercase tracking-wider"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Delivery Details form */}
            <div className="pt-4 space-y-8">
              <div>
                <h2 className="text-2xl font-serif text-stone-900 tracking-tight">
                  Delivery details
                </h2>
                <p className="text-xs text-stone-400 mt-1">
                  Optional: Fill in your delivery info below to include in WhatsApp, or provide it directly in chat.
                </p>
              </div>

              <div className="grid gap-8 sm:grid-cols-2">
                {/* Full name */}
                <div className="flex flex-col border-b border-stone-300 py-1.5 focus-within:border-stone-850">
                  <span className="text-[9px] font-bold text-stone-400 uppercase tracking-widest">
                    Full Name
                  </span>
                  <input
                    type="text"
                    placeholder="Enter your full name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-transparent py-1 text-sm font-semibold outline-none placeholder-stone-300 text-stone-800"
                  />
                </div>

                {/* Phone */}
                <div className="flex flex-col border-b border-stone-300 py-1.5 focus-within:border-stone-850">
                  <span className="text-[9px] font-bold text-stone-400 uppercase tracking-widest">
                    Phone (WhatsApp)
                  </span>
                  <input
                    type="tel"
                    placeholder="Enter your phone number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-transparent py-1 text-sm font-semibold outline-none placeholder-stone-300 text-stone-800"
                  />
                </div>
              </div>

              {/* Area / Street */}
              <div className="flex flex-col border-b border-stone-300 py-1.5 focus-within:border-stone-850">
                <span className="text-[9px] font-bold text-stone-400 uppercase tracking-widest">
                  Area / Street
                </span>
                <input
                  type="text"
                  placeholder="Flat No, House No, Locality, Area"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-transparent py-1 text-sm font-semibold outline-none placeholder-stone-300 text-stone-800"
                />
              </div>

              <div className="grid gap-8 sm:grid-cols-2">
                {/* City */}
                <div className="flex flex-col border-b border-stone-300 py-1.5 focus-within:border-stone-850">
                  <span className="text-[9px] font-bold text-stone-400 uppercase tracking-widest">
                    City
                  </span>
                  <input
                    type="text"
                    placeholder="City"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full bg-transparent py-1 text-sm font-semibold outline-none placeholder-stone-300 text-stone-800"
                  />
                </div>

                {/* PIN */}
                <div className="flex flex-col border-b border-stone-300 py-1.5 focus-within:border-stone-850">
                  <span className="text-[9px] font-bold text-stone-400 uppercase tracking-widest">
                    PIN
                  </span>
                  <input
                    type="text"
                    placeholder="PIN Code"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    className="w-full bg-transparent py-1 text-sm font-semibold outline-none placeholder-stone-300 text-stone-800"
                  />
                </div>
              </div>

              {/* Order Notes */}
              <div className="flex flex-col border-b border-stone-300 py-1.5 focus-within:border-stone-850">
                <span className="text-[9px] font-bold text-stone-400 uppercase tracking-widest">
                  Order Notes (optional)
                </span>
                <textarea
                  rows={2}
                  placeholder="Leave delivery notes here..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-transparent py-1 text-sm font-semibold outline-none placeholder-stone-300 resize-none text-stone-800"
                />
              </div>

              {/* Coupon Code system */}
              <div className="flex flex-col border-b border-stone-300 py-1.5 focus-within:border-stone-850">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-bold text-stone-400 uppercase tracking-widest">
                    Coupon Code (optional)
                  </span>
                  {appliedCoupon && (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 uppercase tracking-wider">
                      Applied: {appliedCoupon.code}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <Ticket size={16} className="text-stone-400 shrink-0" />
                  <input
                    type="text"
                    placeholder="Enter coupon code"
                    value={couponCode}
                    onChange={(e) => {
                      setCouponCode(e.target.value.toUpperCase());
                      setCouponError(null);
                    }}
                    className="w-full bg-transparent py-1 text-sm font-semibold uppercase outline-none placeholder-stone-300 text-stone-800"
                  />
                  {appliedCoupon ? (
                    <button
                      type="button"
                      onClick={removeCoupon}
                      className="shrink-0 px-3 py-1 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded transition-colors"
                    >
                      Remove
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={validating || !couponCode.trim()}
                      onClick={() => handleValidateCoupon()}
                      className="shrink-0 px-3.5 py-1.5 bg-stone-900 text-white text-xs font-bold rounded uppercase tracking-wider disabled:opacity-40 hover:bg-black transition-all"
                    >
                      {validating ? 'Applying…' : 'Apply'}
                    </button>
                  )}
                </div>
                {couponError && (
                  <p className="mt-1 text-xs font-medium text-rose-600">{couponError}</p>
                )}
                {appliedCoupon && (
                  <p className="mt-1 text-xs font-semibold text-emerald-700">
                    ✓ Code {appliedCoupon.code} applied! Saved ₹{appliedCoupon.discountAmount}
                  </p>
                )}
                {!appliedCoupon && user && isFirstOrder && (
                  <p className="mt-1 text-xs font-medium text-amber-700 flex items-center gap-1">
                    <Sparkles size={13} className="shrink-0" />
                    First order! Code <span className="font-bold">FIRST5</span> (5% off) will auto-apply.
                  </p>
                )}
              </div>

            </div>

          </div>

          {/* Right Column: Order Summary */}
          <div className="lg:col-span-2 lg:sticky lg:top-[120px]">
            <div className="rounded-2xl bg-[#f2f1eb] p-6 sm:p-8 shadow-sm space-y-6">
              <h2 className="text-xl font-serif text-stone-900 tracking-tight">
                Summary
              </h2>

              <div className="space-y-4 text-xs font-semibold text-stone-500 border-b border-stone-200 pb-5">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="text-stone-800 font-serif">₹{subtotal.toLocaleString('en-IN')}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span>Sign in for 5% off</span>
                  {user ? (
                    isFirstOrder ? (
                      <span className="text-emerald-700 font-serif">-₹{discountAmount}</span>
                    ) : (
                      <span className="text-stone-400 font-normal">First-order discount used</span>
                    )
                  ) : (
                    <span className="text-stone-400 font-normal">—</span>
                  )}
                </div>

                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span className="text-stone-800 font-serif">
                    {shipping === 0 ? 'FREE' : `₹${shipping}`}
                  </span>
                </div>
              </div>

              <div className="flex justify-between items-baseline text-sm font-bold text-stone-900 border-b border-stone-200 pb-5">
                <span className="text-xs text-stone-500 uppercase tracking-wider">Total</span>
                <span className="text-xl font-serif">₹{total.toLocaleString('en-IN')}</span>
              </div>

              {/* Logged in promo status */}
              {user ? (
                <div className="text-[10px] uppercase font-bold tracking-widest text-emerald-800 bg-emerald-100/50 rounded-lg p-3 text-center border border-emerald-250">
                  {isFirstOrder ? '✓ 5% First Order discount unlocked' : 'Logged in as customer'}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => navigate('/login?redirect=/cart')}
                  className="w-full text-center border border-stone-300 py-3 text-xs font-semibold uppercase tracking-wider rounded-lg hover:bg-stone-200/40 transition-colors"
                >
                  Sign in to unlock 5% →
                </button>
              )}

              {/* WhatsApp preview box */}
              <div className="space-y-2">
                <span className="text-[9px] font-bold text-stone-450 uppercase tracking-widest block">
                  ● WhatsApp message preview
                </span>
                <div className="w-full rounded-xl bg-white border border-stone-200 p-4 text-[10px] font-mono leading-relaxed text-stone-600 select-none whitespace-pre-wrap max-h-[180px] overflow-y-auto">
                  {getWhatsAppMessageText()}
                </div>
              </div>

              {/* Main Submit CTA */}
              <div className="space-y-3">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={handleCheckoutSubmit}
                  className="w-full py-4 text-xs font-bold uppercase tracking-wider text-white rounded-xl shadow-md transition-all hover:brightness-105 active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{ backgroundColor: '#25D366' }}
                >
                  <MessageCircle size={18} className="shrink-0" />
                  <span>{submitting ? 'Opening WhatsApp…' : `Buy via WhatsApp (₹${total.toLocaleString('en-IN')}) →`}</span>
                </button>
                <p className="text-[10px] text-center leading-normal text-stone-400 font-semibold px-2">
                  Direct checkout on WhatsApp (<span className="text-stone-600 font-bold">{siteConfig.phone}</span>). No login or card required upfront. We confirm your size, stock & UPI/online payment directly on WhatsApp!
                </p>
              </div>

            </div>
          </div>

        </div>
      </div>

      {/* WhatsApp Order Confirmation Modal */}
      {orderSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl text-center border border-stone-100">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <CheckCircle2 size={32} />
            </div>
            <h2 className="mt-4 text-xl font-bold font-serif text-stone-900">
              Order Details Sent to WhatsApp!
            </h2>
            <p className="mt-2 text-xs text-stone-500">
              We prepared your order for <span className="font-semibold text-stone-800">{orderSuccess.itemCount} jersey(s)</span> totaling <span className="font-bold text-stone-900">₹{orderSuccess.total.toLocaleString('en-IN')}</span>.
            </p>
            <div className="mt-3 text-xs text-stone-600 bg-stone-50 p-3 rounded-xl border border-stone-200/60 leading-relaxed text-left space-y-1">
              <p>📱 <span className="font-semibold">WhatsApp:</span> {siteConfig.phone}</p>
              <p>💬 <span className="font-semibold">Next Step:</span> Press <span className="font-bold text-emerald-700">Send</span> in WhatsApp to chat with us directly!</p>
            </div>

            <div className="mt-6 flex flex-col gap-2.5">
              <a
                href={orderSuccess.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] py-3.5 text-xs font-bold uppercase tracking-wider text-white shadow transition-all hover:brightness-105 active:scale-[0.99]"
              >
                <MessageCircle size={16} />
                Open WhatsApp Again
              </a>
              <button
                type="button"
                onClick={() => setOrderSuccess(null)}
                className="w-full rounded-xl border border-stone-200 py-3 text-xs font-semibold uppercase tracking-wider text-stone-600 hover:bg-stone-50 transition-colors"
              >
                Continue Shopping
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
