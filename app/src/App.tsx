import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router';
import { Layout } from '@/components/layout/Layout';
import { HomePage } from '@/pages/HomePage';
import { SportShopPage } from '@/pages/SportShopPage';
import { SearchPage } from '@/pages/SearchPage';
import { CategoryPage } from '@/pages/CategoryPage';
import { ProductPage } from '@/pages/ProductPage';
import { AdminPage } from '@/pages/AdminPage';
import { LoginPage } from '@/pages/LoginPage';
import { CartPage } from '@/pages/CartPage';
import { OrderTrackingPage } from '@/pages/OrderTrackingPage';
import { ProfilePage } from '@/pages/ProfilePage';
import { useCatalogStore } from '@/store/catalogStore';
import './App.css';

function App() {
  const init = useCatalogStore((s) => s.init);

  useEffect(() => {
    init();
  }, [init]);

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="football" element={<SportShopPage />} />
        <Route path="f1" element={<SportShopPage />} />
        <Route path="cricket" element={<SportShopPage />} />
        <Route path="search" element={<SearchPage />} />
        <Route path="categories/:slug" element={<CategoryPage />} />
        <Route path="product/:id" element={<ProductPage />} />
        <Route path="adminjs" element={<AdminPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="cart" element={<CartPage />} />
        <Route path="checkout" element={<Navigate to="/cart" replace />} />
        <Route path="order-tracking/:id" element={<OrderTrackingPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default App;
