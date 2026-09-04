import { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Mail, User, Phone, Eye, EyeOff, Loader2, Sparkles, ArrowLeft } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';
import { useWishlistStore } from '@/store/wishlistStore';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signIn, signUp, loading, init } = useAuthStore();
  const syncCart = useCartStore((s) => s.syncWithDB);
  const loadWishlist = useWishlistStore((s) => s.loadWishlist);

  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Get redirect path
  const queryParams = new URLSearchParams(location.search);
  const redirect = queryParams.get('redirect') || '/';

  useEffect(() => {
    init();
  }, [init]);

  useEffect(() => {
    if (user) {
      // Sync local cart and wishlist to DB on login
      Promise.allSettled([syncCart(), loadWishlist()]).finally(() => {
        navigate(redirect, { replace: true });
      });
    }
  }, [user, navigate, redirect, syncCart, loadWishlist]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError(null);
    setStatusMessage(null);

    const trimmedEmail = email.trim();

    if (isLogin) {
      if (!trimmedEmail || !password) {
        setError('Please enter both email and password.');
        return;
      }
      try {
        await signIn(trimmedEmail, password);
      } catch (err: any) {
        setError(err.message || 'Invalid email or password.');
      }
    } else {
      if (!fullName.trim() || !trimmedEmail || !phone.trim() || !password || !confirmPassword) {
        setError('All fields are required.');
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmedEmail)) {
        setError('Please enter a valid email address.');
        return;
      }

      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters.');
        return;
      }

      // Phone number check
      const phoneDigits = phone.replace(/\D/g, '');
      if (phoneDigits.length < 10) {
        setError('Please enter a valid WhatsApp number (at least 10 digits).');
        return;
      }

      try {
        const result = await signUp(trimmedEmail, password, fullName.trim(), phoneDigits);

        if (result.needsEmailVerification) {
          setIsLogin(true);
          setStatusMessage('Account created! Check your email to verify your account, then sign in.');
          setEmail(trimmedEmail);
          setPassword('');
          setConfirmPassword('');
        }
      } catch (err: any) {
        setError(err.message || 'Registration failed. Please check your details.');
      }
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[#FAF9F6] px-4 py-20 pt-[120px]">
      {/* Subtle Background Elements */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-[#1B2A4A]/5 blur-3xl" />
        <div className="absolute -right-32 -bottom-32 h-96 w-96 rounded-full bg-emerald-500/5 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="z-10 w-full max-w-[460px] overflow-hidden rounded-3xl border border-stone-200/80 bg-white/90 p-8 shadow-[0_20px_50px_rgba(0,0,0,0.06)] backdrop-blur-xl sm:p-10"
      >
        {/* Top Header */}
        <div className="flex flex-col items-center justify-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#1B2A4A]/5 p-2 border border-[#1B2A4A]/10 shadow-sm">
            <img src="/logo.jpg" alt="Logo" className="h-full w-full rounded-xl object-cover" />
          </div>

          <h1 className="mt-5 text-2xl font-bold tracking-tight text-[#1B2A4A] font-serif">
            {isLogin ? 'Welcome Back' : 'Join the Club'}
          </h1>
          <p className="mt-1.5 text-xs text-stone-500 leading-relaxed max-w-xs font-sans">
            {isLogin
              ? 'Sign in to access your orders, wishlist, and fast checkout.'
              : 'Create an account to unlock 5% off your first order & track shipments.'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="relative mt-7 flex rounded-xl bg-stone-100 p-1.5 border border-stone-200/60">
          <button
            type="button"
            className={`relative flex-1 rounded-lg py-2.5 text-xs font-bold uppercase tracking-wider transition-colors z-10 ${
              isLogin ? 'text-[#1B2A4A]' : 'text-stone-400 hover:text-stone-700'
            }`}
            onClick={() => {
              setIsLogin(true);
              setError(null);
              setStatusMessage(null);
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`relative flex-1 rounded-lg py-2.5 text-xs font-bold uppercase tracking-wider transition-colors z-10 ${
              !isLogin ? 'text-[#1B2A4A]' : 'text-stone-400 hover:text-stone-700'
            }`}
            onClick={() => {
              setIsLogin(false);
              setError(null);
              setStatusMessage(null);
            }}
          >
            Create Account
          </button>
          
          {/* Animated Tab Background */}
          <motion.div
            className="absolute inset-y-1.5 rounded-lg bg-white shadow-sm border border-stone-200/50"
            initial={false}
            animate={{
              left: isLogin ? '6px' : '50%',
              width: 'calc(50% - 9px)',
            }}
            transition={{ type: 'spring', stiffness: 400, damping: 35 }}
          />
        </div>

        {/* First Order Discount Promo Badge (for sign up) */}
        {!isLogin && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 flex items-center justify-center gap-1.5 rounded-xl bg-amber-50 border border-amber-200/70 p-3 text-center text-xs font-medium text-amber-800"
          >
            <Sparkles size={14} className="shrink-0 text-amber-600" />
            <span>Get <strong className="font-bold text-amber-950">5% OFF</strong> on your first order upon registering!</span>
          </motion.div>
        )}

        {/* Status Message */}
        <AnimatePresence>
          {statusMessage && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs font-medium text-emerald-800"
            >
              {statusMessage}
            </motion.div>
          )}

          {/* Error Notice */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs font-medium text-rose-800"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form */}
        <form onSubmit={handleAuth} className="mt-6 space-y-4">
          <AnimatePresence mode="popLayout">
            {!isLogin && (
              <>
                {/* Full Name */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-1.5"
                >
                  <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400">
                    Full Name
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-stone-400">
                      <User size={16} />
                    </span>
                    <input
                      type="text"
                      required
                      placeholder="Full Name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full rounded-xl border border-stone-200 bg-stone-50/50 py-3 pl-10 pr-4 text-sm font-semibold text-stone-800 outline-none transition-all focus:border-[#1B2A4A] focus:bg-white focus:ring-4 focus:ring-[#1B2A4A]/5"
                    />
                  </div>
                </motion.div>

                {/* Phone (WhatsApp) */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-1.5"
                >
                  <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400">
                    WhatsApp Number
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-stone-400">
                      <Phone size={16} />
                    </span>
                    <input
                      type="tel"
                      required
                      placeholder="WhatsApp Number"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full rounded-xl border border-stone-200 bg-stone-50/50 py-3 pl-10 pr-4 text-sm font-semibold text-stone-800 outline-none transition-all focus:border-[#1B2A4A] focus:bg-white focus:ring-4 focus:ring-[#1B2A4A]/5"
                    />
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>

          {/* Email */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-stone-400">
                <Mail size={16} />
              </span>
              <input
                type="email"
                required
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-stone-200 bg-stone-50/50 py-3 pl-10 pr-4 text-sm font-semibold text-stone-800 outline-none transition-all focus:border-[#1B2A4A] focus:bg-white focus:ring-4 focus:ring-[#1B2A4A]/5"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400">
              Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-stone-400">
                <Lock size={16} />
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-stone-200 bg-stone-50/50 py-3 pl-10 pr-10 text-sm font-semibold text-stone-800 outline-none transition-all focus:border-[#1B2A4A] focus:bg-white focus:ring-4 focus:ring-[#1B2A4A]/5"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-stone-400 hover:text-stone-600"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {!isLogin && (
            /* Confirm Password */
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-1.5"
            >
              <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400">
                Confirm Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-stone-400">
                  <Lock size={16} />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-xl border border-stone-200 bg-stone-50/50 py-3 pl-10 pr-10 text-sm font-semibold text-stone-800 outline-none transition-all focus:border-[#1B2A4A] focus:bg-white focus:ring-4 focus:ring-[#1B2A4A]/5"
                />
              </div>
            </motion.div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="mt-3 w-full flex items-center justify-center gap-2 rounded-xl bg-[#1B2A4A] py-3.5 text-xs font-bold uppercase tracking-wider text-white shadow-lg transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={16} />
                Processing…
              </>
            ) : isLogin ? (
              'Sign In →'
            ) : (
              'Create Account & Get 5% Off →'
            )}
          </button>
        </form>

        {/* Back Link */}
        <div className="mt-6 text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-400 hover:text-[#1B2A4A] transition-colors"
          >
            <ArrowLeft size={13} />
            Continue shopping as guest
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
