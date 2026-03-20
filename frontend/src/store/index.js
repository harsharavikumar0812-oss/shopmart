import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authAPI, cartAPI } from '../services/api';

// AUTH STORE
export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isLoading: false,

      login: async (credentials) => {
        set({ isLoading: true });
        try {
          const { data } = await authAPI.login(credentials);
          localStorage.setItem('accessToken', data.accessToken);
          localStorage.setItem('refreshToken', data.refreshToken);
          set({ user: data.user, accessToken: data.accessToken, refreshToken: data.refreshToken, isLoading: false });
          return { success: true, user: data.user };
        } catch (err) {
          set({ isLoading: false });
          return { success: false, message: err.response?.data?.message || 'Login failed' };
        }
      },

      logout: async () => {
        try { await authAPI.logout(); } catch {}
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        set({ user: null, accessToken: null, refreshToken: null });
      },

      updateUser: (updates) => set((state) => ({ user: { ...state.user, ...updates } })),

      fetchMe: async () => {
        try {
          const { data } = await authAPI.getMe();
          set({ user: data.user });
        } catch {
          get().logout();
        }
      },
    }),
    { name: 'auth-store', partialize: (s) => ({ user: s.user, accessToken: s.accessToken, refreshToken: s.refreshToken }) }
  )
);

// CART STORE
export const useCartStore = create((set, get) => ({
  items: [],
  summary: { itemCount: 0, subtotal: 0, shippingAmount: 0, taxAmount: 0, total: 0, amountToFreeShipping: 0 },
  isLoading: false,
  isOpen: false,

  setOpen: (val) => set({ isOpen: val }),

  fetchCart: async () => {
    set({ isLoading: true });
    try {
      const { data } = await cartAPI.get();
      set({ items: data.items, summary: data.summary, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  addItem: async (productId, quantity = 1) => {
    try {
      await cartAPI.add({ productId, quantity });
      get().fetchCart();
      return { success: true };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Failed to add item' };
    }
  },

  updateItem: async (itemId, quantity) => {
    try {
      await cartAPI.update(itemId, { quantity });
      get().fetchCart();
    } catch (err) {
      console.error(err);
    }
  },

  removeItem: async (itemId) => {
    try {
      await cartAPI.remove(itemId);
      get().fetchCart();
    } catch {}
  },

  clearCart: async () => {
    try {
      await cartAPI.clear();
      set({ items: [], summary: { itemCount: 0, subtotal: 0, shippingAmount: 0, taxAmount: 0, total: 0, amountToFreeShipping: 0 } });
    } catch {}
  },
}));

// WISHLIST STORE
export const useWishlistStore = create((set, get) => ({
  items: [],

  fetch: async () => {
    try {
      const { data } = await cartAPI.getWishlist();
      set({ items: data.items });
    } catch {}
  },

  toggle: async (productId) => {
    try {
      const { data } = await cartAPI.toggleWishlist({ productId });
      get().fetch();
      return data;
    } catch {}
  },

  isWishlisted: (productId) => get().items.some((i) => i.product_id === productId),
}));

// NOTIFICATION STORE
export const useNotificationStore = create((set) => ({
  notifications: [],
  unreadCount: 0,

  fetch: async () => {
    try {
      const { data } = await cartAPI.getNotifications();
      set({ notifications: data.notifications, unreadCount: data.unreadCount });
    } catch {}
  },

  markRead: async () => {
    try {
      await cartAPI.markRead();
      set({ unreadCount: 0 });
    } catch {}
  },
}));
