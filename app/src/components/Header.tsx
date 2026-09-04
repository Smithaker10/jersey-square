import { useState, useEffect } from 'react';
import { Link, NavLink, useLocation } from 'react-router';
import { motion, AnimatePresence, useScroll, useSpring } from 'framer-motion';
import { Search, LogIn, Menu, X, ChevronDown, ShoppingBag, User, LogOut } from 'lucide-react';
import { siteConfig } from '@/config/site';
import { SPORTS } from '@/config/sports';
import { SearchBar } from '@/components/search/SearchBar';
import { useScrollDirection } from '@/hooks/useScrollDirection';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [megaOpen, setMegaOpen] = useState<string | null>(null);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const location = useLocation();
  const cartCount = useCartStore((s) => s.count());
  const { user, profile, signOut, init } = useAuthStore();

  useEffect(() => {
    init();
  }, [init]);

  const { scrollDirection, scrollY } = useScrollDirection();
  const isScrolled = scrollY > 50;
  const isAnnouncementHidden = scrollDirection === 'down' && scrollY > 100;
  const isHome = location.pathname === '/';
  const isTransparent = isHome && !isScrolled;

  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 150, damping: 40, restDelta: 0.001 });

  useEffect(() => {
    setMobileMenuOpen(false);
    setSearchOpen(false);
    setMegaOpen(null);
  }, [location.pathname]);

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `relative text-sm font-medium transition-colors ${
      isTransparent
        ? `${isActive ? 'text-white' : 'text-white/80 hover:text-white'} after:bg-white`
        : `${isActive ? 'text-[#1B2A4A]' : 'text-[#1a1a1a] hover:text-[#1B2A4A]'} after:bg-[#1B2A4A]`
    } after:absolute after:-bottom-1 after:left-0 after:h-0.5 after:w-0 after:transition-all hover:after:w-full ${
      isActive ? 'after:w-full' : ''
    }`;

  return (
    <>
      <header
        className={`fixed left-0 right-0 z-40 transition-all duration-500 ${
          isTransparent
            ? 'border-b border-transparent bg-transparent text-white'
            : isScrolled
            ? 'border-b border-gray-200/80 bg-white/90 shadow-sm backdrop-blur-xl text-[#1a1a1a]'
            : 'border-b border-transparent bg-white/95 text-[#1a1a1a]'
        }`}
        style={{ top: isAnnouncementHidden ? '0px' : '36px' }}
      >
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-4">
            <Link to="/" className="flex shrink-0 items-center gap-2.5">
              <img
                src="/logo.jpg"
                alt={siteConfig.brandName}
                className="h-10 w-10 rounded-full object-cover border border-gray-200/60 shadow-sm transition-transform duration-300 hover:scale-105"
              />
              <span className={`hidden text-xl font-black tracking-wide sm:block transition-colors duration-300 ${
                isTransparent ? 'text-white' : 'text-[#1a1a1a]'
              }`}>
                {siteConfig.brandNameDisplay}
              </span>
            </Link>

            <nav className="hidden items-center gap-1 lg:flex">
              <NavLink to="/" className={navLinkClass} end>
                HOME
              </NavLink>

              {SPORTS.map((sport) => (
                <div
                  key={sport.id}
                  className="relative"
                  onMouseEnter={() => setMegaOpen(sport.id)}
                  onMouseLeave={() => setMegaOpen(null)}
                >
                  <NavLink to={sport.path} className={`${navLinkClass({ isActive: location.pathname === sport.path })} flex items-center gap-1 px-3 py-2`}>
                    {sport.label.toUpperCase()}
                    <ChevronDown size={14} className={`transition-transform ${megaOpen === sport.id ? 'rotate-180' : ''}`} />
                  </NavLink>

                  <AnimatePresence>
                    {megaOpen === sport.id && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        transition={{ duration: 0.2 }}
                        className="absolute left-0 top-full z-50 min-w-[220px] rounded-xl border border-gray-100 bg-white p-3 shadow-xl text-gray-900"
                      >
                        {sport.subcategories.map((sub) => (
                          <Link
                            key={sub.id}
                            to={`/categories/${sub.id}?sport=${sport.id}`}
                            className="block rounded-lg px-3 py-2 text-sm text-[#1a1a1a] hover:bg-gray-50"
                          >
                            {sub.label}
                          </Link>
                        ))}
                        <Link
                          to={sport.path}
                          className="mt-1 block border-t border-gray-100 px-3 pt-2 text-xs font-semibold text-[#1B2A4A]"
                        >
                          View all {sport.label} →
                        </Link>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}

              <NavLink to="/search" className={navLinkClass}>
                SHOP
              </NavLink>
              <a
                href="/#contact"
                className={`px-3 py-2 text-sm font-medium transition-colors duration-300 ${
                  isTransparent ? 'text-white/80 hover:text-white' : 'text-[#1a1a1a] hover:text-[#1B2A4A]'
                }`}
              >
                CONTACT
              </a>
            </nav>

            <div className="hidden flex-1 justify-center md:flex lg:max-w-xs">
              <SearchBar transparent={isTransparent} />
            </div>

            <div className="flex items-center gap-1 sm:gap-2">
              <button
                type="button"
                className={`p-2 md:hidden transition-colors duration-300 ${
                  isTransparent ? 'text-white/80 hover:text-white' : 'text-gray-700 hover:text-[#1B2A4A]'
                }`}
                onClick={() => {
                  setSearchOpen(!searchOpen);
                  setMobileMenuOpen(false);
                }}
                aria-label="Search"
              >
                <Search size={20} />
              </button>

              {/* Cart Icon with Item Badge */}
              <Link
                to="/cart"
                className={`relative p-2 transition-colors duration-300 ${
                  isTransparent ? 'text-white/80 hover:text-white' : 'text-gray-700 hover:text-[#1B2A4A]'
                }`}
                aria-label={`Cart with ${cartCount} items`}
              >
                <ShoppingBag size={20} />
                {cartCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#E53935] text-[9px] font-black text-white">
                    {cartCount}
                  </span>
                )}
              </Link>

              {/* User Account / Profile */}
              {user ? (
                <div
                  className="relative"
                  onMouseEnter={() => setProfileDropdownOpen(true)}
                  onMouseLeave={() => setProfileDropdownOpen(false)}
                >
                  <Link
                    to="/profile"
                    className={`flex items-center gap-1.5 px-2 py-2 text-sm font-semibold transition-colors duration-300 ${
                      isTransparent ? 'text-white/80 hover:text-white' : 'text-gray-700 hover:text-[#1B2A4A]'
                    }`}
                  >
                    <User size={18} />
                    <span className="hidden sm:inline uppercase">
                      {profile?.fullName ? profile.fullName.split(' ')[0] : 'PROFILE'}
                    </span>
                  </Link>

                  <AnimatePresence>
                    {profileDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 top-full z-50 min-w-[180px] rounded-xl border border-gray-100 bg-white p-2 shadow-xl text-gray-900"
                      >
                        <Link
                          to="/profile"
                          className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                        >
                          <User size={14} />
                          My Profile
                        </Link>
                        <button
                          type="button"
                          onClick={() => signOut()}
                          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                        >
                          <LogOut size={14} />
                          Logout
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <Link
                  to="/login"
                  className={`hidden items-center gap-1.5 px-2 text-sm font-medium sm:flex transition-colors duration-300 ${
                    isTransparent ? 'text-white/80 hover:text-white' : 'text-gray-700 hover:text-[#1B2A4A]'
                  }`}
                >
                  <LogIn size={18} />
                  LOGIN
                </Link>
              )}

              <button
                type="button"
                className={`p-2 lg:hidden transition-colors duration-300 ${
                  isTransparent ? 'text-white/80 hover:text-white' : 'text-gray-700 hover:text-[#1B2A4A]'
                }`}
                onClick={() => {
                  setMobileMenuOpen(!mobileMenuOpen);
                  setSearchOpen(false);
                }}
                aria-label="Menu"
              >
                {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>

          </div>

          <AnimatePresence>
            {searchOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden border-t border-gray-100 pb-4 md:hidden"
              >
                <SearchBar autoFocus onClose={() => setSearchOpen(false)} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        {/* Scroll Progress Bar */}
        <motion.div
          className={`absolute bottom-0 left-0 right-0 h-[2px] origin-left z-50 ${
            isTransparent ? 'bg-white/40' : 'bg-gradient-to-r from-[#1B2A4A] to-blue-500'
          }`}
          style={{ scaleX }}
        />
      </header>

      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-start justify-center bg-[#1a1a1a]/80 px-4 pt-28 backdrop-blur-md md:hidden"
            onClick={() => setSearchOpen(false)}
          >
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <SearchBar variant="overlay" autoFocus onClose={() => setSearchOpen(false)} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/40 lg:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.nav
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed bottom-0 right-0 top-[100px] z-50 w-[min(100%,320px)] overflow-y-auto border-l border-gray-100 bg-white p-6 lg:hidden"
            >
              <NavLink to="/" className="block py-3 text-sm font-semibold" onClick={() => setMobileMenuOpen(false)}>
                HOME
              </NavLink>
              {SPORTS.map((sport) => (
                <div key={sport.id} className="border-t border-gray-100 py-2">
                  <Link
                    to={sport.path}
                    className="block py-2 text-sm font-bold text-[#1B2A4A]"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {sport.label}
                  </Link>
                  <div className="ml-3 space-y-1">
                    {sport.subcategories.map((sub) => (
                      <Link
                        key={sub.id}
                        to={`/categories/${sub.id}?sport=${sport.id}`}
                        className="block py-1.5 text-sm text-gray-600"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {sub.label}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
              <NavLink to="/search" className="block border-t border-gray-100 py-3 text-sm font-semibold">
                SEARCH / SHOP
              </NavLink>
              <NavLink
                to="/cart"
                className="block border-t border-gray-100 py-3 text-sm font-semibold"
                onClick={() => setMobileMenuOpen(false)}
              >
                CART ({cartCount})
              </NavLink>
              {user ? (
                <>
                  <NavLink
                    to="/profile"
                    className="block border-t border-gray-100 py-3 text-sm font-semibold"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    MY PROFILE
                  </NavLink>
                  <button
                    type="button"
                    onClick={() => {
                      signOut();
                      setMobileMenuOpen(false);
                    }}
                    className="block w-full border-t border-gray-100 py-3 text-left text-sm font-semibold text-rose-600"
                  >
                    LOGOUT
                  </button>
                </>
              ) : (
                <NavLink
                  to="/login"
                  className="block border-t border-gray-100 py-3 text-sm font-semibold"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  LOGIN
                </NavLink>
              )}
              <a
                href={siteConfig.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block border-t border-gray-100 py-3 text-sm font-medium"
              >
                INSTAGRAM
              </a>
            </motion.nav>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
