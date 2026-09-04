import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useAuthStore } from './authStore';
import { fetchWishlist, toggleWishlist } from '@/lib/api/wishlist';

interface WishlistState {
  ids: number[];
  loading: boolean;
  loadWishlist: () => Promise<void>;
  toggle: (id: number) => Promise<void>;
  has: (id: number) => boolean;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      ids: [],
      loading: false,

      loadWishlist: async () => {
        const user = useAuthStore.getState().user;
        if (!user) return;

        set({ loading: true });
        try {
          const data = await fetchWishlist();
          const ids = (data.products ?? []).map((p: any) => p.id);
          set({ ids, loading: false });
        } catch (err) {
          console.error('Failed to load DB wishlist', err);
          set({ loading: false });
        }
      },

      toggle: async (id) => {
        const user = useAuthStore.getState().user;
        if (user) {
          set({ loading: true });
          try {
            const data = await toggleWishlist(id);
            const ids = get().ids;
            set({
              ids: data.wished ? [...ids, id] : ids.filter((x) => x !== id),
              loading: false,
            });
          } catch (err) {
            console.error('Failed to toggle DB wishlist. Falling back to local state.', err);
            const ids = get().ids;
            set({
              ids: ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id],
              loading: false,
            });
          }
        } else {
          // Guest mode
          const ids = get().ids;
          set({
            ids: ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id],
          });
        }
      },

      has: (id) => get().ids.includes(id),
    }),
    {
      name: 'jerseysquare-wishlist-v2', // Changed version name to avoid state overlap
      partialize: (state) => ({ ids: state.ids }),
    }
  )
);
