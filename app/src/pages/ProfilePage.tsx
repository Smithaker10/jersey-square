import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router';
import { User, Phone, ShoppingBag, Heart, Eye, LogOut, Save, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { fetchOrders } from '@/lib/api/orders';
import { useWishlistStore } from '@/store/wishlistStore';
import { useCatalogStore } from '@/store/catalogStore';
import { ProductCard } from '@/components/ProductCard';
import type { Order } from '@/types/order';

export function ProfilePage() {
  const navigate = useNavigate();
  const { profile, signOut, updateProfile } = useAuthStore();
  const { ids: wishlistIds, loadWishlist } = useWishlistStore();
  const catalogProducts = useCatalogStore((s) => s.products);

  const [activeTab, setActiveTab] = useState<'orders' | 'wishlist' | 'recent'>('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  // Profile Edit Form
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Recently Viewed
  const [recentProducts, setRecentProducts] = useState<any[]>([]);

  useEffect(() => {
    if (profile) {
      setFullName(profile.fullName);
      setPhone(profile.phone);
    }
  }, [profile]);

  useEffect(() => {
    // Load orders
    setLoadingOrders(true);
    fetchOrders()
      .then((data) => {
        setOrders(data.orders ?? []);
        setLoadingOrders(false);
      })
      .catch((err) => {
        console.error(err);
        setLoadingOrders(false);
      });

    // Load wishlist
    loadWishlist();

    // Load recently viewed from localStorage
    try {
      const recentIds = JSON.parse(localStorage.getItem('jerseysquare-recent') || '[]');
      const matched = recentIds
        .map((rid: number) => catalogProducts.find((p) => p.id === rid))
        .filter(Boolean) as any[];
      setRecentProducts(matched);
    } catch {
      setRecentProducts([]);
    }
  }, [catalogProducts, loadWishlist]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !phone.trim()) return;

    setSavingProfile(true);
    setSaveSuccess(false);
    try {
      await updateProfile(fullName.trim(), phone.trim());
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  // Wishlist products
  const wishlistedProducts = wishlistIds
    .map((wid) => catalogProducts.find((p) => p.id === wid))
    .filter(Boolean) as any[];

  return (
    <div className="min-h-screen bg-[#f8fafc] pt-[120px] pb-16">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-4">
          
          {/* Left Column: Profile Card */}
          <div className="lg:col-span-1 space-y-6">
            <div className="rounded-xl border border-white bg-white/70 p-6 shadow-sm backdrop-blur-md text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#1B2A4A] text-white font-black text-xl shadow-md">
                {profile?.fullName ? profile.fullName.charAt(0).toUpperCase() : 'U'}
              </div>
              <h2 className="mt-4 text-base font-bold text-gray-800">{profile?.fullName}</h2>
              <p className="text-xs text-gray-400 mt-0.5">{profile?.email}</p>

              <button
                type="button"
                onClick={handleLogout}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-rose-50 border border-rose-200 py-2.5 text-xs font-semibold text-rose-600 transition-all hover:bg-rose-100"
              >
                <LogOut size={14} />
                Logout Account
              </button>
            </div>

            {/* Profile Update Details */}
            <div className="rounded-xl border border-white bg-white/70 p-6 shadow-sm backdrop-blur-md">
              <h3 className="text-xs font-bold text-[#1B2A4A] uppercase tracking-wider mb-4">
                Profile Details
              </h3>
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    Full Name
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
                      <User size={14} />
                    </span>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-4 text-xs font-medium outline-none focus:border-[#1B2A4A]"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    WhatsApp Number
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
                      <Phone size={14} />
                    </span>
                    <input
                      type="text"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-4 text-xs font-medium outline-none focus:border-[#1B2A4A]"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={savingProfile}
                  className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-[#1B2A4A] py-2 text-xs font-semibold text-white shadow-sm hover:brightness-110 disabled:opacity-60"
                >
                  <Save size={14} />
                  {savingProfile ? 'Saving…' : 'Save Details'}
                </button>

                {saveSuccess && (
                  <div className="flex items-center justify-center gap-1 text-[10px] font-semibold text-emerald-600 bg-emerald-50 rounded border border-emerald-100 py-1">
                    <ShieldCheck size={12} />
                    Profile updated!
                  </div>
                )}
              </form>
            </div>
          </div>

          {/* Right Column: Tab View */}
          <div className="lg:col-span-3 space-y-6">
            {/* Tabs Header */}
            <div className="flex rounded-xl bg-white border border-gray-100 p-1 shadow-sm">
              <button
                type="button"
                className={`flex-1 rounded-lg py-3 text-xs font-semibold transition-all flex items-center justify-center gap-2 ${
                  activeTab === 'orders' ? 'bg-[#1B2A4A] text-white shadow' : 'text-gray-500 hover:text-gray-800'
                }`}
                onClick={() => setActiveTab('orders')}
              >
                <ShoppingBag size={14} />
                ORDERS HISTORY
              </button>
              <button
                type="button"
                className={`flex-1 rounded-lg py-3 text-xs font-semibold transition-all flex items-center justify-center gap-2 ${
                  activeTab === 'wishlist' ? 'bg-[#1B2A4A] text-white shadow' : 'text-gray-500 hover:text-gray-800'
                }`}
                onClick={() => setActiveTab('wishlist')}
              >
                <Heart size={14} />
                MY WISHLIST ({wishlistedProducts.length})
              </button>
              <button
                type="button"
                className={`flex-1 rounded-lg py-3 text-xs font-semibold transition-all flex items-center justify-center gap-2 ${
                  activeTab === 'recent' ? 'bg-[#1B2A4A] text-white shadow' : 'text-gray-500 hover:text-gray-800'
                }`}
                onClick={() => setActiveTab('recent')}
              >
                <Eye size={14} />
                RECENTLY VIEWED ({recentProducts.length})
              </button>
            </div>

            {/* Tab Body */}
            <div>
              {activeTab === 'orders' && (
                <div className="space-y-4">
                  {loadingOrders ? (
                    <div className="flex h-40 items-center justify-center">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#1B2A4A] border-t-transparent" />
                    </div>
                  ) : orders.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-gray-200 bg-white p-12 text-center">
                      <ShoppingBag className="mx-auto h-12 w-12 text-gray-300" />
                      <h3 className="mt-4 text-sm font-bold text-gray-800">No orders placed yet</h3>
                      <p className="mt-1 text-xs text-gray-500">Jerseys you buy will appear in this history list.</p>
                      <Link to="/" className="mt-4 inline-flex text-xs font-bold text-[#1B2A4A] hover:underline">
                        Start shopping →
                      </Link>
                    </div>
                  ) : (
                    orders.map((order) => (
                      <div
                        key={order.id}
                        className="rounded-xl border border-white bg-white/70 p-5 shadow-sm backdrop-blur-md flex flex-col justify-between gap-4 sm:flex-row sm:items-center"
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2.5">
                            <span className="text-sm font-bold text-[#1B2A4A]">Order #JS10{order.id}</span>
                            <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              order.status === 'Cancelled'
                                ? 'bg-rose-100 text-rose-800'
                                : order.status === 'Delivered'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {order.status === 'Pending' ? 'Pending Confirmation' : order.status}
                            </span>
                          </div>
                          <p className="text-xs text-gray-400">
                            Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </p>
                          <p className="text-xs font-semibold text-gray-700">
                            Total: <span className="text-gray-900 font-bold">₹{order.total}</span> · {order.items?.length || 0} items
                          </p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <Link
                            to={`/order-tracking/${order.id}`}
                            className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-50 text-center flex-1 sm:flex-none"
                          >
                            Track Status
                          </Link>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'wishlist' && (
                <div>
                  {wishlistedProducts.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-gray-200 bg-white p-12 text-center">
                      <Heart className="mx-auto h-12 w-12 text-gray-300" />
                      <h3 className="mt-4 text-sm font-bold text-gray-800">Your wishlist is empty</h3>
                      <p className="mt-1 text-xs text-gray-500">Jerseys you like will be saved here.</p>
                    </div>
                  ) : (
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                      {wishlistedProducts.map((prod) => (
                        <ProductCard key={prod.id} product={prod} />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'recent' && (
                <div>
                  {recentProducts.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-gray-200 bg-white p-12 text-center">
                      <Eye className="mx-auto h-12 w-12 text-gray-300" />
                      <h3 className="mt-4 text-sm font-bold text-gray-800">No recently viewed jerseys</h3>
                      <p className="mt-1 text-xs text-gray-500">Jerseys you browse will show up here.</p>
                    </div>
                  ) : (
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                      {recentProducts.map((prod) => (
                        <ProductCard key={prod.id} product={prod} />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
