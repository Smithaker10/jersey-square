import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import { ArrowLeft, Clock, CheckCircle2, Package, Truck, Smile, AlertCircle, ShoppingBag } from 'lucide-react';
import { fetchOrderById } from '@/lib/api/orders';
import { useCartStore } from '@/store/cartStore';
import { useCatalogStore } from '@/store/catalogStore';
import type { Order, OrderStatus } from '@/types/order';

const STEPS: { status: OrderStatus; label: string; desc: string; icon: any }[] = [
  { status: 'Pending', label: 'Pending Confirmation', desc: 'Awaiting WhatsApp message validation', icon: Clock },
  { status: 'Confirmed', label: 'Confirmed', desc: 'Order approved by store owner', icon: CheckCircle2 },
  { status: 'Packed', label: 'Packed', desc: 'Jerseys packed and ready for transit', icon: Package },
  { status: 'Shipped', label: 'Shipped', desc: 'Handed to carrier & tracking active', icon: Truck },
  { status: 'Delivered', label: 'Delivered', desc: 'Package delivered at your address', icon: Smile },
];

export function OrderTrackingPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const addItem = useCartStore((s) => s.addItem);
  const products = useCatalogStore((s) => s.products);

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reordering, setReordering] = useState(false);

  useEffect(() => {
    const orderId = Number(id);
    if (Number.isNaN(orderId)) {
      setError('Invalid Order ID');
      setLoading(false);
      return;
    }

    fetchOrderById(orderId)
      .then((data) => {
        setOrder(data.order);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Failed to load order tracking details.');
        setLoading(false);
      });
  }, [id]);

  const handleBuyAgain = async () => {
    if (!order || !order.items) return;
    setReordering(true);
    try {
      for (const item of order.items) {
        // Find product in catalog
        const catalogProd = products.find((p) => p.id === item.productId);
        if (catalogProd) {
          await addItem(catalogProd, item.size, item.quantity);
        } else if (item.productId) {
          // If not in catalog, construct fallback item structure
          const fallbackProduct: any = {
            id: item.productId,
            title: item.productName,
            price: Number(item.price),
            image: item.productImage || '',
            sport: 'football',
            category: 'fan-version',
            categoryLabel: 'Fan',
            team: '',
            player: null,
            oldPrice: Number(item.price),
            discount: '-0%',
            tags: [],
            popular: 50,
            createdAt: '',
          };
          await addItem(fallbackProduct, item.size, item.quantity);
        }
      }
      navigate('/cart');
    } catch (err) {
      console.error(err);
      alert('Could not add items to cart.');
    } finally {
      setReordering(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center pt-[100px]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#1B2A4A] border-t-transparent" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 pt-[100px] text-center">
        <AlertCircle className="h-14 w-14 text-rose-500" />
        <h2 className="mt-4 text-xl font-bold text-gray-800">Tracking Error</h2>
        <p className="mt-2 text-sm text-gray-500 max-w-sm">{error || 'Order tracking not found.'}</p>
        <Link to="/" className="mt-6 text-sm text-[#1B2A4A] underline">
          Back to catalog
        </Link>
      </div>
    );
  }

  // Get index of current status in steps
  const currentStepIdx = STEPS.findIndex((s) => s.status === order.status);
  const isCancelled = order.status === 'Cancelled';

  return (
    <div className="min-h-screen bg-[#f8fafc] pt-[120px] pb-16">
      <div className="mx-auto max-w-[900px] px-4 sm:px-6">
        <Link
          to="/profile"
          className="mb-6 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[#1a1a1a]"
        >
          <ArrowLeft size={16} />
          Back to profile
        </Link>

        {/* Stepper Header */}
        <div className="rounded-xl border border-white bg-white/70 p-6 shadow-sm backdrop-blur-md">
          <div className="flex flex-col justify-between gap-4 border-b border-gray-100 pb-6 sm:flex-row sm:items-center">
            <div>
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Order Tracking
              </span>
              <h1 className="text-xl font-black text-[#1B2A4A] uppercase sm:text-2xl mt-1">
                Order #JS10{order.id}
              </h1>
              <p className="text-xs text-gray-500 mt-1">
                Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
            <div>
              <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${
                isCancelled 
                  ? 'bg-rose-100 text-rose-800' 
                  : order.status === 'Delivered' 
                  ? 'bg-emerald-100 text-emerald-800' 
                  : 'bg-blue-100 text-blue-800'
              }`}>
                {order.status === 'Pending' ? 'Pending Confirmation' : order.status}
              </span>
            </div>
          </div>

          {/* Vertical/Horizontal Visual Tracker */}
          {isCancelled ? (
            <div className="mt-8 flex items-center gap-4 rounded-xl bg-rose-50 border border-rose-200 p-4 text-rose-800">
              <AlertCircle size={24} className="shrink-0" />
              <div>
                <h3 className="text-sm font-bold">This order was cancelled</h3>
                <p className="text-xs text-rose-600 mt-0.5">Please contact customer support via WhatsApp for questions or to re-order.</p>
              </div>
            </div>
          ) : (
            <div className="mt-10 grid gap-6 md:grid-cols-5 relative">
              {STEPS.map((step, idx) => {
                const Icon = step.icon;
                const isCompleted = idx <= currentStepIdx;
                const isActive = idx === currentStepIdx;

                return (
                  <div key={step.status} className="flex flex-row md:flex-col items-start md:items-center text-left md:text-center gap-4 md:gap-2 relative group">
                    {/* Circle Indicator */}
                    <div className={`z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition-all ${
                      isCompleted 
                        ? 'bg-[#1B2A4A] border-[#1B2A4A] text-white shadow-md shadow-blue-900/10' 
                        : 'bg-white border-gray-200 text-gray-400'
                    }`}>
                      <Icon size={18} />
                    </div>

                    {/* Step Info */}
                    <div className="space-y-0.5">
                      <h4 className={`text-xs font-bold uppercase tracking-wider ${
                        isActive ? 'text-[#1B2A4A]' : isCompleted ? 'text-gray-700' : 'text-gray-400'
                      }`}>
                        {step.label}
                      </h4>
                      <p className="text-[10px] text-gray-500 md:max-w-[140px] leading-snug">
                        {step.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Order Details & Summary Card */}
        <div className="mt-6 grid gap-6 md:grid-cols-3">
          {/* Items Summary */}
          <div className="md:col-span-2 space-y-4">
            <div className="rounded-xl border border-white bg-white/70 p-6 shadow-sm backdrop-blur-md">
              <h2 className="text-sm font-bold text-[#1B2A4A] uppercase tracking-wider mb-4">
                Items Summary
              </h2>
              <div className="space-y-4">
                {order.items?.map((item) => (
                  <div key={item.id} className="flex gap-4 text-sm border-b border-gray-100 pb-4 last:border-b-0 last:pb-0">
                    <div className="aspect-[3/4] h-16 shrink-0 overflow-hidden rounded bg-gray-50 p-1 flex items-center justify-center border border-gray-100">
                      <img src={item.productImage || ''} className="h-full w-full object-contain" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-800 line-clamp-2 leading-snug">
                        {item.productName}
                      </h4>
                      <p className="text-xs text-gray-500 mt-1">
                        Size: <span className="font-bold text-gray-700">{item.size}</span> · Qty: <span className="font-bold text-gray-700">{item.quantity}</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-[#1a1a1a]">
                        ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        ₹{item.price} each
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Delivery Details */}
            <div className="rounded-xl border border-white bg-white/70 p-6 shadow-sm backdrop-blur-md">
              <h2 className="text-sm font-bold text-[#1B2A4A] uppercase tracking-wider mb-4">
                Shipping Details
              </h2>
              <div className="text-xs space-y-1.5 text-gray-600">
                <p><span className="font-semibold text-gray-800">Address:</span> {order.address}</p>
                {order.area && <p><span className="font-semibold text-gray-800">Area:</span> {order.area}</p>}
                <p><span className="font-semibold text-gray-800">City:</span> {order.city}</p>
                <p><span className="font-semibold text-gray-800">PIN Code:</span> {order.pin}</p>
              </div>
            </div>
          </div>

          {/* Pricing breakdown */}
          <div>
            <div className="rounded-xl border border-white bg-white/70 p-6 shadow-sm backdrop-blur-md sticky top-[100px]">
              <h2 className="text-sm font-bold text-[#1B2A4A] uppercase tracking-wider mb-4">
                Price Breakdown
              </h2>
              <div className="space-y-3 text-xs text-gray-600 border-b border-gray-100 pb-4">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold text-gray-800">₹{Number(order.subtotal).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping Fee</span>
                  {Number(order.shipping) === 0 ? (
                    <span className="font-semibold text-emerald-600">FREE</span>
                  ) : (
                    <span className="font-semibold text-gray-800">₹{order.shipping}</span>
                  )}
                </div>
                {Number(order.discount) > 0 && (
                  <div className="flex justify-between text-emerald-600 font-medium">
                    <span>Discount</span>
                    <span>- ₹{Number(order.discount).toLocaleString('en-IN')}</span>
                  </div>
                )}
              </div>
              <div className="mt-4 flex justify-between text-sm font-bold text-[#1a1a1a] border-b border-gray-100 pb-4">
                <span>Grand Total</span>
                <span className="text-base text-[#1B2A4A]">₹{Number(order.total).toLocaleString('en-IN')}</span>
              </div>

              {/* Buy Again button */}
              <button
                type="button"
                onClick={handleBuyAgain}
                disabled={reordering}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#1B2A4A] py-3 text-xs font-semibold text-white shadow hover:brightness-110 disabled:opacity-60"
              >
                <ShoppingBag size={14} />
                {reordering ? 'Adding to cart…' : 'Buy Items Again'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
