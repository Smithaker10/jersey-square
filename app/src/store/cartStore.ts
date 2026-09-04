import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { JerseyProduct } from '@/types/product';
import { useAuthStore } from './authStore';
import {
  fetchCart,
  addToCart,
  updateCartItem,
  deleteCartItem,
  syncCart,
} from '@/lib/api/cart';

export interface CartItem {
  id?: number; // DB cart item ID
  product: JerseyProduct;
  size: string;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  loading: boolean;
  loadCart: () => Promise<void>;
  addItem: (product: JerseyProduct, size: string, quantity?: number) => Promise<void>;
  removeItem: (productId: number, size: string) => Promise<void>;
  updateQuantity: (productId: number, size: string, quantity: number) => Promise<void>;
  clear: () => void;
  count: () => number;
  syncWithDB: () => Promise<void>;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      loading: false,

      loadCart: async () => {
        const user = useAuthStore.getState().user;
        if (!user) return;

        set({ loading: true });
        try {
          const data = await fetchCart();
          set({ items: data.items, loading: false });
        } catch (err) {
          console.error('Failed to load DB cart. Make sure you run migration SQL in your Supabase SQL Editor!', err);
          // Keep local/persisted items so cart does not show empty on DB errors
          set({ loading: false });
        }
      },

      addItem: async (product, size, quantity = 1) => {
        const user = useAuthStore.getState().user;
        if (user) {
          set({ loading: true });
          try {
            await addToCart(product.id, size, quantity);
            const data = await fetchCart();
            set({ items: data.items, loading: false });
            return;
          } catch (err) {
            console.error('Failed to add item in DB. Falling back to local storage.', err);
          }
        }
        
        // Guest/Fallback mode: update local state
        const existingIndex = get().items.findIndex(
          (i) => i.product.id === product.id && i.size === size
        );

        if (existingIndex > -1) {
          const updatedItems = [...get().items];
          updatedItems[existingIndex].quantity += quantity;
          set({ items: updatedItems, loading: false });
        } else {
          set({ items: [...get().items, { product, size, quantity }], loading: false });
        }
      },

      removeItem: async (productId, size) => {
        const user = useAuthStore.getState().user;
        if (user) {
          set({ loading: true });
          const dbItem = get().items.find(
            (i) => i.product.id === productId && i.size === size
          );
          if (dbItem && dbItem.id) {
            try {
              await deleteCartItem(dbItem.id);
              const data = await fetchCart();
              set({ items: data.items, loading: false });
              return;
            } catch (err) {
              console.error('Failed to delete item in DB. Falling back to local storage.', err);
            }
          }
        }
        
        // Guest/Fallback mode
        set({
          items: get().items.filter(
            (i) => !(i.product.id === productId && i.size === size)
          ),
          loading: false,
        });
      },

      updateQuantity: async (productId, size, quantity) => {
        const user = useAuthStore.getState().user;
        if (user) {
          set({ loading: true });
          const dbItem = get().items.find(
            (i) => i.product.id === productId && i.size === size
          );
          if (dbItem && dbItem.id) {
            try {
              await updateCartItem(dbItem.id, quantity);
              const data = await fetchCart();
              set({ items: data.items, loading: false });
              return;
            } catch (err) {
              console.error('Failed to update qty in DB. Falling back to local storage.', err);
            }
          }
        }
        
        // Guest/Fallback mode
        if (quantity <= 0) {
          get().removeItem(productId, size);
          return;
        }
        set({
          items: get().items.map((i) =>
            i.product.id === productId && i.size === size
              ? { ...i, quantity }
              : i
          ),
          loading: false,
        });
      },

      clear: () => set({ items: [] }),

      count: () => get().items.reduce((sum, i) => sum + i.quantity, 0),

      syncWithDB: async () => {
        const user = useAuthStore.getState().user;
        if (!user || get().items.length === 0) return;

        try {
          const localItems = get().items.map((i) => ({
            productId: i.product.id,
            size: i.size,
            quantity: i.quantity,
          }));
          await syncCart(localItems);
          // Load fresh DB cart (clearing local items after successful sync)
          const data = await fetchCart();
          set({ items: data.items });
        } catch (err) {
          console.error('Failed to sync cart on login', err);
        }
      },
    }),
    {
      name: 'jerseysquare-cart-v2', // Changed name to avoid conflicts with old schema
      partialize: (state) => ({ items: state.items }), // Persist only items list
    }
  )
);
