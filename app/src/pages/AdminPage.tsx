import { useMemo, useState, useEffect } from 'react';
import { motion as motionFramer, AnimatePresence as AnimatePresenceFramer } from 'framer-motion';
import {
  AlertTriangle,
  ImagePlus,
  Lock,
  PencilLine,
  Plus,
  Search,
  Shield,
  Trash2,
  X,
  ShoppingBag,
  Users,
  Ticket,
  BarChart4,
  Copy,
  ExternalLink,
  Calendar,
  IndianRupee,
  RefreshCw,
  Clock,
  CheckSquare
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';

import { CATEGORY_LABELS, getSportConfig } from '@/config/sports';
import {
  createProduct,
  deleteProduct,
  fetchAdminProducts,
  type AdminProduct,
  type AdminProductPayload,
  updateProduct,
  uploadProductImage,
  fetchAdminOrders,
  updateOrderStatus,
  fetchAdminCustomers,
  fetchAdminCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  fetchAdminAnalytics
} from '@/lib/api/admin';
import { useCatalogStore } from '@/store/catalogStore';
import type { Sport, StockStatus } from '@/types/product';
import type { Order, OrderStatus } from '@/types/order';
import type { Coupon } from '@/types/coupon';

type ProductFormState = {
  name: string;
  sport: Sport;
  categoryId: string;
  team: string;
  player: string;
  description: string;
  stockStatus: StockStatus;
  price: string;
  oldPrice: string;
  discount: string;
  tags: string;
  popular: string;
};

type Notice = { type: 'ok' | 'err'; text: string } | null;

const stockLabels: Record<StockStatus, string> = {
  in_stock: 'In stock',
  low_stock: 'Low stock',
  out_of_stock: 'Out of stock',
  preorder: 'Preorder',
};

const stockBadgeClasses: Record<StockStatus, string> = {
  in_stock: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
  low_stock: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
  out_of_stock: 'border-rose-500/30 bg-rose-500/10 text-rose-300',
  preorder: 'border-sky-500/30 bg-sky-500/10 text-sky-300',
};

function stockLabelClass(status: StockStatus) {
  return stockBadgeClasses[status] ?? stockBadgeClasses.in_stock;
}


const sportBadgeClasses: Record<Sport, string> = {
  football: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-300',
  f1: 'border-orange-500/30 bg-orange-500/10 text-orange-300',
  cricket: 'border-lime-500/30 bg-lime-500/10 text-lime-300',
};

function getCategoryLabel(sport: Sport, categoryId: string) {
  return (
    getSportConfig(sport).subcategories.find((c) => c.id === categoryId)?.label ??
    CATEGORY_LABELS[categoryId] ??
    categoryId
  );
}

function createEmptyForm(): ProductFormState {
  const sport = 'football';
  const categoryId = getSportConfig(sport).subcategories[0]?.id ?? 'fan-version';

  return {
    name: '',
    sport,
    categoryId,
    team: '',
    player: '',
    description: '',
    stockStatus: 'in_stock',
    price: '',
    oldPrice: '',
    discount: '-50%',
    tags: '',
    popular: '50',
  };
}

function formFromProduct(product: AdminProduct): ProductFormState {
  return {
    name: product.name,
    sport: product.sport as Sport,
    categoryId: product.categoryId,
    team: product.team,
    player: product.player ?? '',
    description: product.description ?? '',
    stockStatus: product.stockStatus,
    price: String(product.price),
    oldPrice: String(product.oldPrice),
    discount: product.discount,
    tags: product.tags.join(', '),
    popular: String(product.popular ?? 50),
  };
}

function toPayload(form: ProductFormState, image: string): AdminProductPayload {
  const categoryLabel = getCategoryLabel(form.sport, form.categoryId);

  return {
    name: form.name.trim(),
    sport: form.sport,
    categoryId: form.categoryId,
    categoryLabel,
    team: form.team.trim(),
    player: form.player.trim() || undefined,
    description: form.description.trim(),
    stockStatus: form.stockStatus,
    price: Number(form.price),
    oldPrice: Number(form.oldPrice),
    discount: form.discount.trim(),
    tags: form.tags
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean),
    popular: Number(form.popular),
    image,
  };
}

export function AdminPage() {
  const refresh = useCatalogStore((s) => s.refresh);
  const [adminSecret, setAdminSecret] = useState('');
  const [unlocked, setUnlocked] = useState(false);
  const [authenticating, setAuthenticating] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);

  // Tab State
  const [activeTab, setActiveTab] = useState<'products' | 'orders' | 'customers' | 'coupons' | 'analytics'>('products');

  // ================= PRODUCTS TAB STATE =================
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [sportFilter, setSportFilter] = useState<'all' | Sport>('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [submittingProduct, setSubmittingProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<AdminProduct | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState<AdminProduct | null>(null);
  const [createImageFile, setCreateImageFile] = useState<File | null>(null);
  const [createImagePreview, setCreateImagePreview] = useState<string>('/logo.png');
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [editImagePreview, setEditImagePreview] = useState<string>('/logo.png');
  const [form, setForm] = useState<ProductFormState>(createEmptyForm());
  const [editForm, setEditForm] = useState<ProductFormState>(createEmptyForm());

  // ================= ORDERS TAB STATE =================
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<'all' | OrderStatus>('all');
  const [updatingOrderId, setUpdatingOrderId] = useState<number | null>(null);

  // ================= CUSTOMERS TAB STATE =================
  const [customers, setCustomers] = useState<any[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);

  // ================= COUPONS TAB STATE =================
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loadingCoupons, setLoadingCoupons] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<any | null>(null);
  const [couponCode, setCouponCode] = useState('');
  const [couponType, setCouponType] = useState<'percentage' | 'fixed'>('percentage');
  const [couponValue, setCouponValue] = useState('');
  const [couponMinAmount, setCouponMinAmount] = useState('0');
  const [couponMaxDiscount, setCouponMaxDiscount] = useState('');
  const [couponLimit, setCouponLimit] = useState('');
  const [couponExpiry, setCouponExpiry] = useState('');
  const [savingCoupon, setSavingCoupon] = useState(false);

  // ================= ANALYTICS TAB STATE =================
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  // Load dashboard data based on active tab
  useEffect(() => {
    if (!unlocked) return;

    if (activeTab === 'products') {
      loadProductsList();
    } else if (activeTab === 'orders') {
      loadOrdersList();
    } else if (activeTab === 'customers') {
      loadCustomersList();
    } else if (activeTab === 'coupons') {
      loadCouponsList();
    } else if (activeTab === 'analytics') {
      loadAnalyticsData();
    }
  }, [unlocked, activeTab]);

  const loadProductsList = async () => {
    setLoadingProducts(true);
    try {
      const data = await fetchAdminProducts(adminSecret);
      setProducts(data);
    } catch (err: any) {
      setNotice({ type: 'err', text: err.message || 'Failed to load products' });
    } finally {
      setLoadingProducts(false);
    }
  };

  const loadOrdersList = async () => {
    setLoadingOrders(true);
    try {
      const data = await fetchAdminOrders(adminSecret);
      setOrders(data.orders);
    } catch (err: any) {
      setNotice({ type: 'err', text: err.message || 'Failed to load orders' });
    } finally {
      setLoadingOrders(false);
    }
  };

  const loadCustomersList = async () => {
    setLoadingCustomers(true);
    try {
      const data = await fetchAdminCustomers(adminSecret);
      setCustomers(data.customers);
    } catch (err: any) {
      setNotice({ type: 'err', text: err.message || 'Failed to load customers' });
    } finally {
      setLoadingCustomers(false);
    }
  };

  const loadCouponsList = async () => {
    setLoadingCoupons(true);
    try {
      const data = await fetchAdminCoupons(adminSecret);
      setCoupons(data.coupons);
    } catch (err: any) {
      setNotice({ type: 'err', text: err.message || 'Failed to load coupons' });
    } finally {
      setLoadingCoupons(false);
    }
  };

  const loadAnalyticsData = async () => {
    setLoadingAnalytics(true);
    try {
      const data = await fetchAdminAnalytics(adminSecret);
      setAnalyticsData(data);
    } catch (err: any) {
      setNotice({ type: 'err', text: err.message || 'Failed to load analytics' });
    } finally {
      setLoadingAnalytics(false);
    }
  };

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminSecret.trim()) {
      setNotice({ type: 'err', text: 'Enter the admin secret to continue.' });
      return;
    }

    setAuthenticating(true);
    setNotice(null);
    try {
      // Test the secret by fetching products
      await fetchAdminProducts(adminSecret.trim());
      setUnlocked(true);
      setNotice({ type: 'ok', text: 'Admin dashboard unlocked.' });
    } catch (err: any) {
      setNotice({
        type: 'err',
        text: err.message || 'Failed to authenticate. Check your secret.',
      });
      setUnlocked(false);
    } finally {
      setAuthenticating(false);
    }
  };

  // ================= ORDER INTERACTIONS =================
  const handleUpdateStatus = async (orderId: number, status: OrderStatus) => {
    setUpdatingOrderId(orderId);
    try {
      await updateOrderStatus(orderId, status, adminSecret);
      // Reload orders
      await loadOrdersList();
      setNotice({ type: 'ok', text: `Order #JS10${orderId} status updated to ${status}.` });
    } catch (err: any) {
      setNotice({ type: 'err', text: err.message || 'Failed to update status' });
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const formatOrderWhatsAppMsg = (order: any) => {
    const lines = [
      `Hello Jersey Square 👋`,
      `🆔 Order #JS10${order.id}`,
      ``,
      `👤 Customer`,
      `${order.customer_name}`,
      ``,
      `📞 WhatsApp`,
      `${order.customer_phone}`,
      ``,
      `📧 Email`,
      `${order.customer_email}`,
      `━━━━━━━━━━━━━━`,
      ``,
      `🛒 Items`,
    ];

    (order.items ?? []).forEach((item: any) => {
      lines.push(`• ${item.product_name}`);
      lines.push(`  Size: ${item.size}`);
      lines.push(`  Qty: ${item.quantity}`);
      lines.push(`  ₹${item.price * item.quantity}`);
      lines.push(``);
    });

    lines.push(`━━━━━━━━━━━━━━`);
    lines.push(``);
    lines.push(`Delivery Address`);
    lines.push(order.address);
    if (order.area) lines.push(order.area);
    lines.push(order.city);
    lines.push(order.pin);
    lines.push(``);
    lines.push(`━━━━━━━━━━━━━━`);
    lines.push(``);

    if (order.coupon) {
      lines.push(`Coupon`);
      lines.push(order.coupon);
      lines.push(``);
    }

    if (order.notes) {
      lines.push(`Order Notes`);
      lines.push(order.notes);
      lines.push(``);
      lines.push(`━━━━━━━━━━━━━━`);
      lines.push(``);
    }

    lines.push(`Subtotal : ₹${order.subtotal}`);
    lines.push(`Shipping : ₹${order.shipping}`);
    lines.push(`Discount : ₹${order.discount}`);
    lines.push(`Total : ₹${order.total}`);
    lines.push(``);
    lines.push(`Thank you ❤️`);

    return lines.join('\n');
  };

  const handleCopyOrderMsg = (order: any) => {
    const msg = formatOrderWhatsAppMsg(order);
    navigator.clipboard.writeText(msg);
    setNotice({ type: 'ok', text: `WhatsApp receipt for Order #JS10${order.id} copied to clipboard!` });
  };

  const handleOpenWhatsAppChat = (order: any) => {
    const msg = formatOrderWhatsAppMsg(order);
    const encoded = encodeURIComponent(msg);
    window.open(`https://wa.me/91${order.customer_phone}?text=${encoded}`, '_blank');
  };

  // ================= COUPON INTERACTIONS =================
  const handleSaveCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim() || !couponValue) return;

    setSavingCoupon(true);
    try {
      const payload = {
        code: couponCode.trim().toUpperCase(),
        discountType: couponType,
        discountValue: Number(couponValue),
        minAmount: Number(couponMinAmount),
        maxDiscount: couponMaxDiscount ? Number(couponMaxDiscount) : null,
        usageLimit: couponLimit ? Number(couponLimit) : null,
        expiryDate: couponExpiry || null,
      };

      if (editingCoupon) {
        await updateCoupon(editingCoupon.id, payload, adminSecret);
        setNotice({ type: 'ok', text: `Coupon ${payload.code} updated successfully.` });
      } else {
        await createCoupon(payload, adminSecret);
        setNotice({ type: 'ok', text: `Coupon ${payload.code} created successfully.` });
      }
      setEditingCoupon(null);
      resetCouponForm();
      await loadCouponsList();
    } catch (err: any) {
      setNotice({ type: 'err', text: err.message || 'Failed to save coupon' });
    } finally {
      setSavingCoupon(false);
    }
  };

  const handleEditCouponClick = (c: Coupon) => {
    setEditingCoupon(c);
    setCouponCode(c.code);
    setCouponType(c.discountType);
    setCouponValue(String(c.discountValue));
    setCouponMinAmount(String(c.minAmount));
    setCouponMaxDiscount(c.maxDiscount ? String(c.maxDiscount) : '');
    setCouponLimit(c.usageLimit ? String(c.usageLimit) : '');
    setCouponExpiry(c.expiryDate ? c.expiryDate.split('T')[0] : '');
  };

  const handleDeleteCouponClick = async (id: number, code: string) => {
    if (!confirm(`Are you sure you want to delete coupon ${code}?`)) return;

    try {
      await deleteCoupon(id, adminSecret);
      setNotice({ type: 'ok', text: `Coupon ${code} deleted.` });
      await loadCouponsList();
    } catch (err: any) {
      setNotice({ type: 'err', text: err.message || 'Failed to delete coupon' });
    }
  };

  const resetCouponForm = () => {
    setCouponCode('');
    setCouponType('percentage');
    setCouponValue('');
    setCouponMinAmount('0');
    setCouponMaxDiscount('');
    setCouponLimit('');
    setCouponExpiry('');
  };

  // ================= PRODUCTS TAB CRUD =================
  const patch = (partial: Partial<ProductFormState>) =>
    setForm((prev) => ({ ...prev, ...partial }));

  const patchEdit = (partial: Partial<ProductFormState>) =>
    setEditForm((prev) => ({ ...prev, ...partial }));

  const syncCatalog = async () => {
    try {
      await refresh();
      setNotice({ type: 'ok', text: 'Public storefront catalogue updated.' });
    } catch {
      setNotice({ type: 'err', text: 'Failed to update public storefront.' });
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotice(null);
    setSubmittingProduct(true);

    try {
      let imageUrl = '';
      if (createImageFile) {
        imageUrl = await uploadProductImage(createImageFile, adminSecret);
      } else {
        throw new Error('Please select an image for the new product.');
      }

      const payload = toPayload(form, imageUrl);
      await createProduct(payload, adminSecret);
      setNotice({ type: 'ok', text: `Product "${payload.name}" created successfully.` });

      // Clear form
      setForm(createEmptyForm());
      setCreateImageFile(null);
      setCreateImagePreview('/logo.png');

      await loadProductsList();
      syncCatalog();
    } catch (err) {
      setNotice({
        type: 'err',
        text: err instanceof Error ? err.message : 'Failed to create product',
      });
    } finally {
      setSubmittingProduct(false);
    }
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    setNotice(null);
    setSavingEdit(true);

    try {
      let imageUrl = editingProduct.image;
      if (editImageFile) {
        imageUrl = await uploadProductImage(editImageFile, adminSecret);
      }

      const payload = toPayload(editForm, imageUrl);
      await updateProduct(editingProduct.id, payload, adminSecret);
      setNotice({ type: 'ok', text: `Product "${payload.name}" updated.` });

      setEditingProduct(null);
      setEditImageFile(null);

      await loadProductsList();
      syncCatalog();
    } catch (err) {
      setNotice({
        type: 'err',
        text: err instanceof Error ? err.message : 'Failed to save edits',
      });
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteProduct = async () => {
    if (!deletingProduct) return;
    setNotice(null);

    try {
      await deleteProduct(deletingProduct.id, adminSecret);
      setNotice({ type: 'ok', text: 'Product deleted successfully.' });
      setDeletingProduct(null);
      await loadProductsList();
      syncCatalog();
    } catch (err) {
      setNotice({
        type: 'err',
        text: err instanceof Error ? err.message : 'Failed to delete product',
      });
    }
  };

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchSearch =
        productSearch.trim() === '' ||
        p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
        p.team.toLowerCase().includes(productSearch.toLowerCase()) ||
        (p.player && p.player.toLowerCase().includes(productSearch.toLowerCase()));

      const matchSport = sportFilter === 'all' || p.sport === sportFilter;
      const matchCat = categoryFilter === 'all' || p.categoryId === categoryFilter;

      return matchSearch && matchSport && matchCat;
    });
  }, [products, productSearch, sportFilter, categoryFilter]);

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const matchSearch =
        orderSearch.trim() === '' ||
        o.id.toString().includes(orderSearch) ||
        o.customerName.toLowerCase().includes(orderSearch.toLowerCase()) ||
        o.customerPhone.includes(orderSearch) ||
        o.customerEmail.toLowerCase().includes(orderSearch.toLowerCase());

      const matchStatus = orderStatusFilter === 'all' || o.status === orderStatusFilter;

      return matchSearch && matchStatus;
    });
  }, [orders, orderSearch, orderStatusFilter]);

  // Filtered Customers
  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      const q = customerSearch.toLowerCase();
      return (
        customerSearch.trim() === '' ||
        c.name.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        c.email.toLowerCase().includes(q)
      );
    });
  }, [customers, customerSearch]);

  const COLORS = ['#1B2A4A', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  if (!unlocked) {
    return (
      <div className="relative flex min-h-screen items-center justify-center bg-[#0d1527] px-4 py-20">
        <div className="absolute inset-0 z-0 bg-cover bg-center opacity-10" style={{ backgroundImage: "url('/cricket.webp')" }} />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0d1527] via-slate-900 to-[#0d1527] opacity-90" />

        <motionFramer.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="z-10 w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/60 p-8 shadow-2xl backdrop-blur-md"
        >
          <div className="text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-400">
              <Shield size={32} />
            </div>
            <h1 className="mt-4 text-2xl font-black tracking-tight text-white uppercase">
              Admin Gateway
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              Enter secret passphrase to unlock the management systems.
            </p>
          </div>

          {notice?.type === 'err' && (
            <div className="mt-4 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs font-semibold text-rose-300">
              {notice.text}
            </div>
          )}

          <form onSubmit={handleUnlock} className="mt-6 space-y-4">
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
                <Lock size={16} />
              </span>
              <input
                type="password"
                required
                placeholder="Admin Secret"
                value={adminSecret}
                onChange={(e) => setAdminSecret(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950/60 py-3 pl-10 pr-4 text-sm text-white placeholder-slate-500 outline-none transition-all focus:border-blue-500 focus:bg-slate-950"
              />
            </div>
            <button
              type="submit"
              disabled={authenticating}
              className="w-full rounded-xl bg-blue-600 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition-all hover:bg-blue-500 active:scale-[0.98] disabled:opacity-60"
            >
              {authenticating ? 'Verifying…' : 'Unlock Dashboard'}
            </button>
          </form>
        </motionFramer.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d1527] text-slate-100 pt-[100px] pb-16">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
        
        {/* Admin Header */}
        <div className="flex flex-col justify-between gap-4 border-b border-slate-800 pb-6 md:flex-row md:items-center">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white uppercase flex items-center gap-2">
              <Shield className="text-blue-500" size={24} />
              JerseySquare Admin Control
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Logged in as system owner. Direct access to database objects.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (activeTab === 'products') loadProductsList();
                else if (activeTab === 'orders') loadOrdersList();
                else if (activeTab === 'customers') loadCustomersList();
                else if (activeTab === 'coupons') loadCouponsList();
                else if (activeTab === 'analytics') loadAnalyticsData();
              }}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors border border-slate-700"
              title="Refresh database"
            >
              <RefreshCw size={16} />
            </button>
            <button
              onClick={() => setUnlocked(false)}
              className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold hover:bg-slate-750 transition-colors"
            >
              Lock Panel
            </button>
          </div>
        </div>

        {/* Global Alert Bar */}
        {notice && (
          <div className={`mt-4 rounded-xl border p-4 text-xs font-semibold flex items-center justify-between ${
            notice.type === 'ok' 
              ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400' 
              : 'border-rose-500/20 bg-rose-500/10 text-rose-400'
          }`}>
            <span>{notice.text}</span>
            <button onClick={() => setNotice(null)} className="opacity-60 hover:opacity-100">
              <X size={14} />
            </button>
          </div>
        )}

        {/* Control Tabs */}
        <div className="mt-6 flex border-b border-slate-800 pb-px overflow-x-auto gap-2">
          {[
            { id: 'products', label: 'Products Catalogue', icon: ShoppingBag },
            { id: 'orders', label: 'Orders Queue', icon: Clock },
            { id: 'customers', label: 'Customers Ledger', icon: Users },
            { id: 'coupons', label: 'Discount Coupons', icon: Ticket },
            { id: 'analytics', label: 'Analytics Panel', icon: BarChart4 },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as any);
                  setNotice(null);
                }}
                className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
                  active 
                    ? 'border-blue-500 text-white bg-slate-800/40 rounded-t-lg' 
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon size={14} />
                {tab.label.toUpperCase()}
              </button>
            );
          })}
        </div>

        {/* Tabs Render */}
        <div className="mt-8">
          {/* ================= 1. PRODUCTS CATALOGUE TAB ================= */}
          {activeTab === 'products' && (
            <div className="grid gap-8 lg:grid-cols-3">
              {/* Product Creation Form */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-md">
                <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-6 flex items-center gap-1.5">
                  <Plus size={16} /> Create Product
                </h2>
                <form onSubmit={handleCreateProduct} className="space-y-4">
                  {/* Image Select */}
                  <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-800 rounded-xl p-4 bg-slate-950/20">
                    <img src={createImagePreview} className="h-28 w-28 object-contain rounded-lg border border-slate-850" />
                    <label className="mt-3 cursor-pointer rounded-lg bg-slate-800 border border-slate-700 px-3.5 py-1.5 text-xs font-semibold hover:bg-slate-750 transition-colors flex items-center gap-1">
                      <ImagePlus size={14} /> Select Image
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setCreateImageFile(file);
                            setCreateImagePreview(URL.createObjectURL(file));
                          }
                        }}
                      />
                    </label>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Product Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Barcelona 125th Anniversary Retro"
                      value={form.name}
                      onChange={(e) => patch({ name: e.target.value })}
                      className="w-full rounded-lg border border-slate-800 bg-slate-950/60 px-3.5 py-2.5 text-xs text-white placeholder-slate-600 outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sport</label>
                      <select
                        value={form.sport}
                        onChange={(e) => {
                          const sport = e.target.value as Sport;
                          const categories = getSportConfig(sport).subcategories;
                          patch({ sport, categoryId: categories[0]?.id ?? 'fan-version' });
                        }}
                        className="w-full rounded-lg border border-slate-800 bg-slate-950/60 px-3.5 py-2.5 text-xs text-white outline-none focus:border-blue-500"
                      >
                        <option value="football">Football</option>
                        <option value="f1">Formula 1</option>
                        <option value="cricket">Cricket</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Category</label>
                      <select
                        value={form.categoryId}
                        onChange={(e) => patch({ categoryId: e.target.value })}
                        className="w-full rounded-lg border border-slate-800 bg-slate-950/60 px-3.5 py-2.5 text-xs text-white outline-none focus:border-blue-500"
                      >
                        {getSportConfig(form.sport).subcategories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Team Club</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Barcelona"
                        value={form.team}
                        onChange={(e) => patch({ team: e.target.value })}
                        className="w-full rounded-lg border border-slate-800 bg-slate-950/60 px-3.5 py-2.5 text-xs text-white outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Player Name (optional)</label>
                      <input
                        type="text"
                        placeholder="e.g. Messi"
                        value={form.player}
                        onChange={(e) => patch({ player: e.target.value })}
                        className="w-full rounded-lg border border-slate-800 bg-slate-950/60 px-3.5 py-2.5 text-xs text-white outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Price (₹)</label>
                      <input
                        type="number"
                        required
                        placeholder="799"
                        value={form.price}
                        onChange={(e) => patch({ price: e.target.value })}
                        className="w-full rounded-lg border border-slate-800 bg-slate-950/60 px-3.5 py-2.5 text-xs text-white outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Old Price (₹)</label>
                      <input
                        type="number"
                        placeholder="1599"
                        value={form.oldPrice}
                        onChange={(e) => patch({ oldPrice: e.target.value })}
                        className="w-full rounded-lg border border-slate-800 bg-slate-950/60 px-3.5 py-2.5 text-xs text-white outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Stock Status</label>
                      <select
                        value={form.stockStatus}
                        onChange={(e) => patch({ stockStatus: e.target.value as StockStatus })}
                        className="w-full rounded-lg border border-slate-800 bg-slate-950/60 px-3.5 py-2.5 text-xs text-white outline-none"
                      >
                        <option value="in_stock">In Stock</option>
                        <option value="low_stock">Low Stock</option>
                        <option value="out_of_stock">Out of Stock</option>
                        <option value="preorder">Pre-Order</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Popular Score (0-100)</label>
                      <input
                        type="number"
                        placeholder="90"
                        value={form.popular}
                        onChange={(e) => patch({ popular: e.target.value })}
                        className="w-full rounded-lg border border-slate-800 bg-slate-950/60 px-3.5 py-2.5 text-xs text-white outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Search Keywords / Tags</label>
                    <input
                      type="text"
                      placeholder="e.g. laliga, messi, football, retro"
                      value={form.tags}
                      onChange={(e) => patch({ tags: e.target.value })}
                      className="w-full rounded-lg border border-slate-800 bg-slate-950/60 px-3.5 py-2.5 text-xs text-white outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submittingProduct}
                    className="w-full rounded-xl bg-blue-600 py-3 text-xs font-semibold text-white transition-colors hover:bg-blue-500 disabled:opacity-60 mt-4"
                  >
                    {submittingProduct ? 'Creating Product…' : 'Publish Product'}
                  </button>
                </form>
              </div>

              {/* Product Listing Table */}
              <div className="lg:col-span-2 space-y-4">
                <div className="flex flex-col gap-3 rounded-xl border border-slate-800 bg-slate-900/40 p-4 backdrop-blur-md md:flex-row md:items-center">
                  <div className="relative flex-1">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
                      <Search size={14} />
                    </span>
                    <input
                      type="text"
                      placeholder="Search catalogue products…"
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      className="w-full rounded-lg border border-slate-800 bg-slate-950/60 py-2 pl-9 pr-4 text-xs outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="flex gap-2">
                    <select
                      value={sportFilter}
                      onChange={(e) => setSportFilter(e.target.value as any)}
                      className="rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2 text-xs outline-none"
                    >
                      <option value="all">All Sports</option>
                      <option value="football">Football</option>
                      <option value="f1">Formula 1</option>
                      <option value="cricket">Cricket</option>
                    </select>
                    <select
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      className="rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2 text-xs outline-none"
                    >
                      <option value="all">All Categories</option>
                      {Object.entries(CATEGORY_LABELS).map(([id, label]) => (
                        <option key={id} value={id}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/20 shadow-xl">
                  {loadingProducts ? (
                    <div className="flex h-60 items-center justify-center">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
                    </div>
                  ) : filteredProducts.length === 0 ? (
                    <div className="py-20 text-center text-slate-500 text-xs font-semibold">
                      No products found. Add products or adjust filters.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-slate-800 bg-slate-950/40 text-slate-400 font-bold uppercase tracking-wider">
                            <th className="p-4">Jersey</th>
                            <th className="p-4">Sport / Category</th>
                            <th className="p-4">Price</th>
                            <th className="p-4">Stock</th>
                            <th className="p-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-850">
                          {filteredProducts.map((p) => (
                            <tr key={p.id} className="hover:bg-slate-850/20 transition-colors">
                              <td className="p-4 flex items-center gap-3">
                                <div className="h-10 w-10 shrink-0 rounded bg-slate-950/40 p-1 flex items-center justify-center border border-slate-800">
                                  <img src={p.image} className="h-full w-full object-contain" />
                                </div>
                                <div className="min-w-0">
                                  <span className="font-bold text-white block truncate max-w-[200px]" title={p.name}>
                                    {p.name}
                                  </span>
                                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                                    {p.team} {p.player ? `· ${p.player}` : ''}
                                  </span>
                                </div>
                              </td>
                              <td className="p-4">
                                <span className={`inline-block rounded-full border px-2 py-0.5 text-[9px] font-bold ${sportBadgeClasses[p.sport as Sport]}`}>
                                  {p.sport.toUpperCase()}
                                </span>
                                <span className="block text-[10px] text-slate-400 mt-1">
                                  {p.categoryLabel}
                                </span>
                              </td>
                              <td className="p-4 font-bold text-slate-200">
                                ₹{p.price}
                                {p.oldPrice > p.price && (
                                  <span className="block text-[10px] text-slate-500 line-through mt-0.5">
                                    ₹{p.oldPrice}
                                  </span>
                                )}
                              </td>
                              <td className="p-4">
                                <span className={`inline-block rounded border px-2 py-0.5 text-[10px] font-semibold ${stockLabelClass(p.stockStatus)}`}>
                                  {stockLabels[p.stockStatus] || p.stockStatus}
                                </span>
                              </td>
                              <td className="p-4 text-right">
                                <div className="flex justify-end gap-2">
                                  <button
                                    onClick={() => {
                                      setEditingProduct(p);
                                      setEditForm(formFromProduct(p));
                                      setEditImagePreview(p.image);
                                    }}
                                    className="p-2 rounded bg-slate-800 border border-slate-700 text-slate-300 hover:text-white"
                                    title="Edit product"
                                  >
                                    <PencilLine size={14} />
                                  </button>
                                  <button
                                    onClick={() => setDeletingProduct(p)}
                                    className="p-2 rounded bg-rose-500/10 border border-rose-500/25 text-rose-400 hover:bg-rose-500/20 hover:text-rose-300"
                                    title="Delete product"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ================= 2. ORDERS QUEUE TAB ================= */}
          {activeTab === 'orders' && (
            <div className="space-y-4">
              <div className="flex flex-col gap-3 rounded-xl border border-slate-800 bg-slate-900/40 p-4 backdrop-blur-md md:flex-row md:items-center">
                <div className="relative flex-1">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
                    <Search size={14} />
                  </span>
                  <input
                    type="text"
                    placeholder="Search by Order ID, Customer Name, Phone, Email…"
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                    className="w-full rounded-lg border border-slate-800 bg-slate-950/60 py-2 pl-9 pr-4 text-xs outline-none focus:border-blue-500"
                  />
                </div>
                <div className="flex gap-2">
                  <select
                    value={orderStatusFilter}
                    onChange={(e) => setOrderStatusFilter(e.target.value as any)}
                    className="rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2 text-xs outline-none"
                  >
                    <option value="all">All Statuses</option>
                    <option value="Pending">Pending Confirmation</option>
                    <option value="Confirmed">Confirmed</option>
                    <option value="Packed">Packed</option>
                    <option value="Shipped">Shipped</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/20 shadow-xl">
                {loadingOrders ? (
                  <div className="flex h-60 items-center justify-center">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
                  </div>
                ) : filteredOrders.length === 0 ? (
                  <div className="py-20 text-center text-slate-500 text-xs font-semibold">
                    No orders in queue.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-800">
                    {filteredOrders.map((o) => (
                      <div key={o.id} className="p-6 hover:bg-slate-850/10 transition-colors flex flex-col md:flex-row md:items-start justify-between gap-6">
                        
                        {/* Left: Customer & Delivery Details */}
                        <div className="space-y-3 flex-1">
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-bold text-white uppercase">Order #JS10{o.id}</span>
                            <span className={`inline-flex rounded-full px-2 py-0.5 text-[9px] font-bold ${
                              o.status === 'Cancelled'
                                ? 'bg-rose-500/15 text-rose-400 border border-rose-500/20'
                                : o.status === 'Delivered'
                                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                                : 'bg-blue-500/15 text-blue-400 border border-blue-500/20'
                            }`}>
                              {o.status === 'Pending' ? 'Pending Confirmation' : o.status}
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium">
                              📅 {new Date(o.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>

                          <div className="grid gap-4 sm:grid-cols-3 text-[11px] text-slate-400">
                            <div>
                              <h4 className="font-bold text-slate-300 uppercase tracking-wider text-[9px]">Customer</h4>
                              <p className="mt-1 text-white font-medium">{o.customerName}</p>
                              <p>{o.customerPhone}</p>
                              <p className="truncate max-w-[160px]">{o.customerEmail}</p>
                            </div>
                            <div className="sm:col-span-2">
                              <h4 className="font-bold text-slate-300 uppercase tracking-wider text-[9px]">Delivery Address</h4>
                              <p className="mt-1 text-white font-medium">{o.address}</p>
                              <p>{o.area ? `${o.area}, ` : ''}{o.city} - {o.pin}</p>
                              {o.notes && (
                                <p className="mt-1 bg-amber-500/10 text-amber-300 rounded border border-amber-500/20 px-2 py-0.5 text-[10px]">
                                  📝 Notes: {o.notes}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Items Breakdown list */}
                          <div className="border-t border-slate-800/80 pt-3 mt-3">
                            <h4 className="font-bold text-slate-300 uppercase tracking-wider text-[9px] mb-2">Order Items</h4>
                            <div className="space-y-2">
                              {(o.items ?? []).map((item: any) => (
                                <div key={item.id} className="flex justify-between items-center text-xs">
                                  <div className="flex items-center gap-2">
                                    <div className="h-6 w-6 rounded bg-slate-950 border border-slate-800 p-0.5 flex items-center justify-center">
                                      <img src={item.product_image || ''} className="h-full w-full object-contain" />
                                    </div>
                                    <span className="font-medium text-slate-200">{item.product_name}</span>
                                    <span className="text-[10px] bg-slate-800 text-slate-400 px-1 rounded font-bold">Size {item.size}</span>
                                  </div>
                                  <span className="text-slate-300 font-semibold">₹{item.price} × {item.quantity}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Right: Actions, Totals & WhatsApp */}
                        <div className="md:w-64 border-t border-slate-800/80 pt-4 md:border-t-0 md:pt-0 flex flex-col justify-between items-stretch md:items-end self-stretch gap-4">
                          {/* Prices breakdown */}
                          <div className="text-xs space-y-1.5 text-right font-medium">
                            <div className="flex justify-between md:justify-end gap-6 text-slate-400">
                              <span>Subtotal:</span>
                              <span>₹{o.subtotal}</span>
                            </div>
                            {Number(o.discount) > 0 && (
                              <div className="flex justify-between md:justify-end gap-6 text-emerald-400">
                                <span>Discount:</span>
                                <span>- ₹{o.discount}</span>
                              </div>
                            )}
                            <div className="flex justify-between md:justify-end gap-6 text-slate-400">
                              <span>Shipping:</span>
                              <span>₹{o.shipping}</span>
                            </div>
                            <div className="flex justify-between md:justify-end gap-6 text-sm font-bold text-white border-t border-slate-800 pt-1.5 mt-1.5">
                              <span>Grand Total:</span>
                              <span className="text-blue-400">₹{o.total}</span>
                            </div>
                          </div>

                          {/* Order State Transition Actions */}
                          <div className="space-y-2 w-full flex flex-col">
                            {/* Update Status Dropdown */}
                            <div className="flex items-center justify-between md:justify-end gap-3">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status:</span>
                              <select
                                value={o.status}
                                disabled={updatingOrderId === o.id}
                                onChange={(e) => handleUpdateStatus(o.id, e.target.value as OrderStatus)}
                                className="rounded bg-slate-800 border border-slate-700 px-2 py-1 text-xs outline-none text-white focus:border-blue-500 font-semibold"
                              >
                                <option value="Pending">Pending Confirmation</option>
                                <option value="Confirmed">Confirmed</option>
                                <option value="Packed">Packed</option>
                                <option value="Shipped">Shipped</option>
                                <option value="Delivered">Delivered</option>
                                <option value="Cancelled">Cancelled</option>
                              </select>
                            </div>

                            {/* WhatsApp shortcuts */}
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleCopyOrderMsg(o)}
                                className="flex-1 flex items-center justify-center gap-1.5 rounded bg-slate-800 hover:bg-slate-750 py-2 text-[10px] font-bold border border-slate-700 text-slate-300"
                                title="Copy WhatsApp formatted receipt to clipboard"
                              >
                                <Copy size={12} /> Copy Receipt
                              </button>
                              <button
                                onClick={() => handleOpenWhatsAppChat(o)}
                                className="flex-1 flex items-center justify-center gap-1.5 rounded bg-[#25D366]/10 hover:bg-[#25D366]/20 py-2 text-[10px] font-bold border border-[#25D366]/25 text-[#25D366]"
                                title="Open WhatsApp chat with prefilled message"
                              >
                                <ExternalLink size={12} /> Open WhatsApp
                              </button>
                            </div>
                          </div>
                        </div>

                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ================= 3. CUSTOMERS LEDGER TAB ================= */}
          {activeTab === 'customers' && (
            <div className="grid gap-8 lg:grid-cols-3">
              {/* Customers list */}
              <div className="lg:col-span-2 space-y-4">
                <div className="flex flex-col gap-3 rounded-xl border border-slate-800 bg-slate-900/40 p-4 backdrop-blur-md md:flex-row md:items-center">
                  <div className="relative flex-1">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
                      <Search size={14} />
                    </span>
                    <input
                      type="text"
                      placeholder="Search customer ledger by Name, Phone, Email…"
                      value={customerSearch}
                      onChange={(e) => setCustomerSearch(e.target.value)}
                      className="w-full rounded-lg border border-slate-800 bg-slate-950/60 py-2 pl-9 pr-4 text-xs outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/20 shadow-xl">
                  {loadingCustomers ? (
                    <div className="flex h-60 items-center justify-center">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
                    </div>
                  ) : filteredCustomers.length === 0 ? (
                    <div className="py-20 text-center text-slate-500 text-xs font-semibold">
                      No customers found.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-slate-800 bg-slate-950/40 text-slate-400 font-bold uppercase tracking-wider">
                            <th className="p-4">Customer</th>
                            <th className="p-4">WhatsApp Contact</th>
                            <th className="p-4">Joined Date</th>
                            <th className="p-4 text-right">Activity Stats</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-850">
                          {filteredCustomers.map((c) => (
                            <tr
                              key={c.id}
                              onClick={() => setSelectedCustomer(c)}
                              className={`cursor-pointer hover:bg-slate-800/20 transition-colors ${
                                selectedCustomer?.id === c.id ? 'bg-slate-800/40' : ''
                              }`}
                            >
                              <td className="p-4">
                                <span className="font-bold text-white block text-sm">
                                  {c.name}
                                </span>
                                <span className="text-[10px] text-slate-400">
                                  {c.email}
                                </span>
                              </td>
                              <td className="p-4 text-slate-300 font-medium">
                                {c.phone}
                              </td>
                              <td className="p-4 text-slate-400">
                                {new Date(c.joinedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </td>
                              <td className="p-4 text-right">
                                <span className="font-bold text-slate-200">₹{c.lifetimeValue} LTV</span>
                                <span className="block text-[10px] text-slate-500 mt-0.5">
                                  {c.totalOrders} total orders
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

              {/* Customer Detail Drawer */}
              <div>
                {selectedCustomer ? (
                  <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-md space-y-6">
                    <div className="flex justify-between items-center border-b border-slate-800 pb-4">
                      <div>
                        <h3 className="text-sm font-bold text-white uppercase tracking-wider">Customer Details</h3>
                        <p className="text-[10px] text-slate-400 mt-0.5">ID: {selectedCustomer.id.slice(0, 8)}...</p>
                      </div>
                      <button onClick={() => setSelectedCustomer(null)} className="p-1 rounded hover:bg-slate-800">
                        <X size={16} />
                      </button>
                    </div>

                    <div className="space-y-4">
                      {/* Stats cards */}
                      <div className="grid gap-3 grid-cols-2">
                        <div className="bg-slate-950/40 rounded-xl border border-slate-850 p-4">
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Total Spent</span>
                          <span className="text-lg font-black text-blue-400 mt-1 block">₹{selectedCustomer.lifetimeValue}</span>
                        </div>
                        <div className="bg-slate-950/40 rounded-xl border border-slate-850 p-4">
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Orders Count</span>
                          <span className="text-lg font-black text-emerald-400 mt-1 block">{selectedCustomer.totalOrders}</span>
                        </div>
                      </div>

                      {/* Info details */}
                      <div className="space-y-2.5 text-xs border-b border-slate-800 pb-4">
                        <p className="flex justify-between">
                          <span className="text-slate-400">Full Name:</span>
                          <span className="font-semibold text-white">{selectedCustomer.name}</span>
                        </p>
                        <p className="flex justify-between">
                          <span className="text-slate-400">WhatsApp:</span>
                          <span className="font-semibold text-white">{selectedCustomer.phone}</span>
                        </p>
                        <p className="flex justify-between">
                          <span className="text-slate-400">Email:</span>
                          <span className="font-semibold text-white truncate max-w-[180px]">{selectedCustomer.email}</span>
                        </p>
                      </div>

                      {/* Recent Orders List */}
                      <div>
                        <h4 className="font-bold text-slate-300 uppercase tracking-wider text-[9px] mb-3">Order History</h4>
                        <div className="space-y-2">
                          {(selectedCustomer.orders ?? []).map((o: any) => (
                            <div key={o.id} className="flex justify-between items-center bg-slate-950/30 rounded-lg p-3 border border-slate-850">
                              <div>
                                <span className="font-bold text-white text-xs">#JS10{o.id}</span>
                                <span className="text-[10px] text-slate-500 block mt-0.5">
                                  {new Date(o.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                </span>
                              </div>
                              <div className="text-right">
                                <span className="font-bold text-blue-400 text-xs">₹{o.total}</span>
                                <span className="block text-[9px] font-bold uppercase text-slate-400 mt-0.5">{o.status}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-slate-800 bg-slate-900/10 p-12 text-center text-slate-500 text-xs font-semibold">
                    Select a customer to inspect detail logs.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ================= 4. DISCOUNT COUPONS TAB ================= */}
          {activeTab === 'coupons' && (
            <div className="grid gap-8 lg:grid-cols-3">
              {/* Coupon Management Form */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-md">
                <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-6 flex items-center gap-1.5">
                  <Ticket size={16} /> {editingCoupon ? 'Edit Coupon' : 'Create Coupon'}
                </h2>
                <form onSubmit={handleSaveCoupon} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Coupon Code</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. RETRO15"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      className="w-full rounded-lg border border-slate-800 bg-slate-950/60 px-3.5 py-2.5 text-xs text-white placeholder-slate-600 outline-none uppercase focus:border-blue-500"
                    />
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Discount Type</label>
                      <select
                        value={couponType}
                        onChange={(e) => setCouponType(e.target.value as any)}
                        className="w-full rounded-lg border border-slate-800 bg-slate-950/60 px-3.5 py-2.5 text-xs text-white outline-none"
                      >
                        <option value="percentage">Percentage (%)</option>
                        <option value="fixed">Fixed Flat (₹)</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Value</label>
                      <input
                        type="number"
                        required
                        placeholder={couponType === 'percentage' ? '15' : '150'}
                        value={couponValue}
                        onChange={(e) => setCouponValue(e.target.value)}
                        className="w-full rounded-lg border border-slate-800 bg-slate-950/60 px-3.5 py-2.5 text-xs text-white outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Min Spend (₹)</label>
                      <input
                        type="number"
                        placeholder="500"
                        value={couponMinAmount}
                        onChange={(e) => setCouponMinAmount(e.target.value)}
                        className="w-full rounded-lg border border-slate-800 bg-slate-950/60 px-3.5 py-2.5 text-xs text-white outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Max Cap (₹, optional)</label>
                      <input
                        type="number"
                        placeholder="200"
                        value={couponMaxDiscount}
                        onChange={(e) => setCouponMaxDiscount(e.target.value)}
                        className="w-full rounded-lg border border-slate-800 bg-slate-950/60 px-3.5 py-2.5 text-xs text-white outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Usage Limit (optional)</label>
                      <input
                        type="number"
                        placeholder="e.g. 50"
                        value={couponLimit}
                        onChange={(e) => setCouponLimit(e.target.value)}
                        className="w-full rounded-lg border border-slate-800 bg-slate-950/60 px-3.5 py-2.5 text-xs text-white outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Expiry Date</label>
                      <input
                        type="date"
                        value={couponExpiry}
                        onChange={(e) => setCouponExpiry(e.target.value)}
                        className="w-full rounded-lg border border-slate-800 bg-slate-950/60 px-3.5 py-2.5 text-xs text-white outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    {editingCoupon && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingCoupon(null);
                          resetCouponForm();
                        }}
                        className="flex-1 rounded-xl border border-slate-700 bg-slate-800 py-3 text-xs font-semibold hover:bg-slate-750 text-white"
                      >
                        Cancel
                      </button>
                    )}
                    <button
                      type="submit"
                      disabled={savingCoupon}
                      className="flex-1 rounded-xl bg-blue-600 py-3 text-xs font-semibold text-white hover:bg-blue-500 disabled:opacity-60"
                    >
                      {savingCoupon ? 'Saving…' : editingCoupon ? 'Update Coupon' : 'Create Coupon'}
                    </button>
                  </div>
                </form>
              </div>

              {/* Coupons List Table */}
              <div className="lg:col-span-2">
                <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/20 shadow-xl">
                  {loadingCoupons ? (
                    <div className="flex h-60 items-center justify-center">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
                    </div>
                  ) : coupons.length === 0 ? (
                    <div className="py-20 text-center text-slate-500 text-xs font-semibold">
                      No discount coupons created yet.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-slate-800 bg-slate-950/40 text-slate-400 font-bold uppercase tracking-wider">
                            <th className="p-4">Coupon Code</th>
                            <th className="p-4">Discount Value</th>
                            <th className="p-4">Min Order / Max Cap</th>
                            <th className="p-4">Limit / Usage</th>
                            <th className="p-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-850">
                          {coupons.map((c) => (
                            <tr key={c.id} className="hover:bg-slate-850/20 transition-colors">
                              <td className="p-4">
                                <span className="font-bold text-white block text-sm">
                                  {c.code}
                                </span>
                                {c.expiryDate ? (
                                  <span className="text-[10px] text-slate-500 mt-0.5 block">
                                    Expires: {new Date(c.expiryDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-emerald-500 mt-0.5 block">
                                    Permanent
                                  </span>
                                )}
                              </td>
                              <td className="p-4 font-bold text-slate-200">
                                {c.discountType === 'percentage' 
                                  ? `${c.discountValue}% OFF` 
                                  : `₹${c.discountValue} OFF`}
                              </td>
                              <td className="p-4 text-slate-300">
                                <div>Min: ₹{c.minAmount}</div>
                                {c.maxDiscount && <div className="text-[10px] text-slate-500 mt-0.5">Max Cap: ₹{c.maxDiscount}</div>}
                              </td>
                              <td className="p-4 font-semibold text-slate-400">
                                {c.usageCount} used
                                {c.usageLimit && <span className="text-slate-500 font-normal"> / {c.usageLimit} limit</span>}
                              </td>
                              <td className="p-4 text-right">
                                <div className="flex justify-end gap-2">
                                  <button
                                    onClick={() => handleEditCouponClick(c)}
                                    className="p-2 rounded bg-slate-800 border border-slate-700 text-slate-300 hover:text-white"
                                    title="Edit coupon"
                                  >
                                    <PencilLine size={14} />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteCouponClick(c.id, c.code)}
                                    className="p-2 rounded bg-rose-500/10 border border-rose-500/25 text-rose-400 hover:bg-rose-500/20 hover:text-rose-300"
                                    title="Delete coupon"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ================= 5. ANALYTICS PANEL TAB ================= */}
          {activeTab === 'analytics' && (
            <div className="space-y-8">
              {loadingAnalytics ? (
                <div className="flex h-60 items-center justify-center">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
                </div>
              ) : !analyticsData ? (
                <div className="py-20 text-center text-slate-500 text-xs font-semibold">
                  Failed to compute analytics.
                </div>
              ) : (
                <>
                  {/* Metrics Row */}
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    {[
                      { label: 'Total Revenue', value: `₹${analyticsData.metrics.totalRevenue.toLocaleString('en-IN')}`, icon: IndianRupee, color: 'text-blue-500 bg-blue-500/10 border-blue-500/20' },
                      { label: 'Validated Orders', value: analyticsData.metrics.totalOrders, icon: CheckSquare, color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' },
                      { label: 'Average Order Value', value: `₹${analyticsData.metrics.averageOrderValue}`, icon: ShoppingBag, color: 'text-amber-500 bg-amber-500/10 border-amber-500/20' },
                      { label: 'Repeat Customer Rate', value: `${analyticsData.metrics.repeatCustomerRate}%`, icon: Users, color: 'text-violet-500 bg-violet-500/10 border-violet-500/20' },
                    ].map((card) => {
                      const Icon = card.icon;

                      return (
                        <div key={card.label} className={`rounded-xl border p-5 backdrop-blur-md flex items-center justify-between bg-slate-900/40 ${card.color.split(' ')[2]}`}>
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{card.label}</span>
                            <span className="text-2xl font-black text-white mt-1.5 block">{card.value}</span>
                          </div>
                          <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${card.color.split(' ')[0]} ${card.color.split(' ')[1]}`}>
                            <Icon size={24} />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Charts Grid */}
                  <div className="grid gap-6 lg:grid-cols-2">
                    {/* Revenue Trend Area Chart */}
                    <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-md">
                      <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-1.5">
                        <Calendar size={14} className="text-blue-500" /> Revenue Growth Trend
                      </h3>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={analyticsData.monthlySales}>
                            <defs>
                              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4}/>
                                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <XAxis dataKey="month" stroke="#64748B" fontSize={10} tickLine={false} />
                            <YAxis stroke="#64748B" fontSize={10} tickLine={false} />
                            <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', fontSize: '12px' }} />
                            <Area type="monotone" dataKey="revenue" stroke="#3B82F6" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Top Selling Clubs Bar Chart */}
                    <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-md">
                      <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-1.5">
                        <ShoppingBag size={14} className="text-emerald-500" /> Top-Selling Clubs / Teams
                      </h3>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={analyticsData.topClubs}>
                            <XAxis dataKey="name" stroke="#64748B" fontSize={10} tickLine={false} />
                            <YAxis stroke="#64748B" fontSize={10} tickLine={false} />
                            <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', fontSize: '12px' }} />
                            <Bar dataKey="value" fill="#10B981" radius={[4, 4, 0, 0]}>
                              {analyticsData.topClubs.map((_entry: any, index: number) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Sizes Pie Chart */}
                    <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-md">
                      <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-1.5">
                        <Clock size={14} className="text-amber-500" /> Sizing Distribution
                      </h3>
                      <div className="h-64 flex items-center justify-center">
                        <div className="w-[60%] h-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={analyticsData.topSizes}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                              >
                                {analyticsData.topSizes.map((_entry: any, index: number) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', fontSize: '12px' }} />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="w-[40%] space-y-1.5 text-xs text-slate-400 font-semibold pl-4">
                          {analyticsData.topSizes.map((entry: any, index: number) => (
                            <div key={entry.name} className="flex items-center gap-2">
                              <span className="h-3 w-3 rounded-full inline-block" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                              <span className="text-white font-bold">{entry.name}:</span>
                              <span>{entry.value} pcs</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Order Status Pie Chart */}
                    <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-md">
                      <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-1.5">
                        <Shield size={14} className="text-violet-500" /> Order Status Ratios
                      </h3>
                      <div className="h-64 flex items-center justify-center">
                        <div className="w-[60%] h-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={analyticsData.orderStatuses}
                                cx="50%"
                                cy="50%"
                                innerRadius={0}
                                outerRadius={80}
                                dataKey="value"
                              >
                                {analyticsData.orderStatuses.map((_entry: any, index: number) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', fontSize: '12px' }} />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="w-[40%] space-y-1.5 text-xs text-slate-400 font-semibold pl-4">
                          {analyticsData.orderStatuses.map((entry: any, index: number) => (
                            <div key={entry.name} className="flex items-center gap-2">
                              <span className="h-3 w-3 rounded-full inline-block" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                              <span className="text-white font-bold">{entry.name}:</span>
                              <span>{entry.value} orders</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

      </div>

      {/* Edit Product Modal */}
      <AnimatePresenceFramer>
        {editingProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <motionFramer.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl overflow-y-auto max-h-[85vh]"
            >
              <div className="flex justify-between items-center border-b border-slate-800 pb-4 mb-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Edit Product</h3>
                <button onClick={() => setEditingProduct(null)} className="p-1 rounded hover:bg-slate-800">
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleUpdateProduct} className="space-y-4">
                {/* Image Select */}
                <div className="flex items-center gap-4 border border-slate-800 rounded-xl p-3 bg-slate-950/20">
                  <img src={editImagePreview} className="h-16 w-16 object-contain rounded border border-slate-850" />
                  <label className="cursor-pointer rounded-lg bg-slate-800 border border-slate-700 px-3 py-1.5 text-[11px] font-semibold hover:bg-slate-750 transition-colors">
                    Change Image
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setEditImageFile(file);
                          setEditImagePreview(URL.createObjectURL(file));
                        }
                      }}
                    />
                  </label>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Product Name</label>
                  <input
                    type="text"
                    required
                    value={editForm.name}
                    onChange={(e) => patchEdit({ name: e.target.value })}
                    className="w-full rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2 text-xs text-white outline-none focus:border-blue-500"
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sport</label>
                    <select
                      value={editForm.sport}
                      onChange={(e) => {
                        const sport = e.target.value as Sport;
                        const categories = getSportConfig(sport).subcategories;
                        patchEdit({ sport, categoryId: categories[0]?.id ?? 'fan-version' });
                      }}
                      className="w-full rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2 text-xs text-white outline-none"
                    >
                      <option value="football">Football</option>
                      <option value="f1">Formula 1</option>
                      <option value="cricket">Cricket</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Category</label>
                    <select
                      value={editForm.categoryId}
                      onChange={(e) => patchEdit({ categoryId: e.target.value })}
                      className="w-full rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2 text-xs text-white outline-none"
                    >
                      {getSportConfig(editForm.sport).subcategories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Team Club</label>
                    <input
                      type="text"
                      required
                      value={editForm.team}
                      onChange={(e) => patchEdit({ team: e.target.value })}
                      className="w-full rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2 text-xs text-white outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Player Name</label>
                    <input
                      type="text"
                      value={editForm.player}
                      onChange={(e) => patchEdit({ player: e.target.value })}
                      className="w-full rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2 text-xs text-white outline-none"
                    />
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Price (₹)</label>
                    <input
                      type="number"
                      required
                      value={editForm.price}
                      onChange={(e) => patchEdit({ price: e.target.value })}
                      className="w-full rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2 text-xs text-white outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Old Price (₹)</label>
                    <input
                      type="number"
                      value={editForm.oldPrice}
                      onChange={(e) => patchEdit({ oldPrice: e.target.value })}
                      className="w-full rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2 text-xs text-white outline-none"
                    />
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Stock Status</label>
                    <select
                      value={editForm.stockStatus}
                      onChange={(e) => patchEdit({ stockStatus: e.target.value as StockStatus })}
                      className="w-full rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2 text-xs text-white outline-none"
                    >
                      <option value="in_stock">In Stock</option>
                      <option value="low_stock">Low Stock</option>
                      <option value="out_of_stock">Out of Stock</option>
                      <option value="preorder">Pre-Order</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Popular Score (0-100)</label>
                    <input
                      type="number"
                      value={editForm.popular}
                      onChange={(e) => patchEdit({ popular: e.target.value })}
                      className="w-full rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2 text-xs text-white outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Search Keywords / Tags</label>
                  <input
                    type="text"
                    value={editForm.tags}
                    onChange={(e) => patchEdit({ tags: e.target.value })}
                    className="w-full rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2 text-xs text-white outline-none"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingProduct(null)}
                    className="flex-1 rounded-xl border border-slate-700 bg-slate-800 py-3 text-xs font-semibold hover:bg-slate-750 text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingEdit}
                    className="flex-1 rounded-xl bg-blue-600 py-3 text-xs font-semibold text-white hover:bg-blue-500 disabled:opacity-60"
                  >
                    {savingEdit ? 'Saving…' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </motionFramer.div>
          </div>
        )}
      </AnimatePresenceFramer>

      {/* Delete Product Dialog */}
      <AnimatePresenceFramer>
        {deletingProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <motionFramer.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl"
            >
              <div className="text-center">
                <AlertTriangle className="mx-auto h-12 w-12 text-rose-400" />
                <h3 className="mt-4 text-base font-bold text-white uppercase tracking-wider">Delete Product?</h3>
                <p className="mt-2 text-xs text-slate-450 leading-relaxed">
                  Are you sure you want to delete <span className="text-white font-semibold">{deletingProduct.name}</span>? This cannot be undone.
                </p>
              </div>
              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => setDeletingProduct(null)}
                  className="flex-1 rounded-xl border border-slate-700 bg-slate-800 py-2.5 text-xs font-semibold text-white hover:bg-slate-750"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteProduct}
                  className="flex-1 rounded-xl bg-rose-650 py-2.5 text-xs font-semibold text-white hover:bg-rose-500 shadow-md shadow-rose-900/10"
                >
                  Delete
                </button>
              </div>
            </motionFramer.div>
          </div>
        )}
      </AnimatePresenceFramer>
    </div>
  );
}
