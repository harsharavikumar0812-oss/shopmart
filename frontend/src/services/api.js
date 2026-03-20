import axios from 'axios';

const API = axios.create({
  baseURL: '/api',
  withCredentials: true,
});

// Request interceptor - attach token
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response interceptor - refresh on 401
API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && error.response?.data?.expired && !original._retry) {
      original._retry = true;
      try {
        const refresh = localStorage.getItem('refreshToken');
        const { data } = await axios.post('/api/auth/refresh', { refreshToken: refresh });
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return API(original);
      } catch {
        localStorage.clear();
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth
export const authAPI = {
  register: (data) => API.post('/auth/register', data),
  registerVendor: (data) => API.post('/auth/register/vendor', data),
  login: (data) => API.post('/auth/login', data),
  logout: () => API.post('/auth/logout'),
  getMe: () => API.get('/auth/me'),
  updateProfile: (data) => API.put('/auth/profile', data),
  changePassword: (data) => API.put('/auth/change-password', data),
};

// Products
export const productAPI = {
  getAll: (params) => API.get('/products', { params }),
  getOne: (id) => API.get(`/products/${id}`),
  getFeatured: () => API.get('/products/featured'),
  getCategories: () => API.get('/products/categories'),
  create: (data) => API.post('/products', data),
  update: (id, data) => API.put(`/products/${id}`, data),
  delete: (id) => API.delete(`/products/${id}`),
  getVendorProducts: (params) => API.get('/products/vendor/list', { params }),
  addReview: (id, data) => API.post(`/products/${id}/reviews`, data),
};

// Cart
export const cartAPI = {
  get: () => API.get('/cart'),
  add: (data) => API.post('/cart/add', data),
  update: (itemId, data) => API.put(`/cart/items/${itemId}`, data),
  remove: (itemId) => API.delete(`/cart/items/${itemId}`),
  clear: () => API.delete('/cart/clear'),
  applyCoupon: (data) => API.post('/cart/apply-coupon', data),
  getWishlist: () => API.get('/cart/wishlist'),
  toggleWishlist: (data) => API.post('/cart/wishlist/toggle', data),
  getAddresses: () => API.get('/cart/addresses'),
  addAddress: (data) => API.post('/cart/addresses', data),
  deleteAddress: (id) => API.delete(`/cart/addresses/${id}`),
  getNotifications: () => API.get('/cart/notifications'),
  markRead: () => API.put('/cart/notifications/read'),
};

// Orders
export const orderAPI = {
  create: (data) => API.post('/orders', data),
  getAll: (params) => API.get('/orders', { params }),
  getOne: (id) => API.get(`/orders/${id}`),
  cancel: (id, data) => API.put(`/orders/${id}/cancel`, data),
  getVendorOrders: (params) => API.get('/orders/vendor', { params }),
  getVendorAnalytics: (params) => API.get('/orders/vendor/analytics', { params }),
  updateItemStatus: (itemId, data) => API.put(`/orders/vendor/items/${itemId}/status`, data),
};

// Admin
export const adminAPI = {
  getStats: () => API.get('/admin/stats'),
  getAnalytics: (params) => API.get('/admin/analytics', { params }),
  getVendors: (params) => API.get('/admin/vendors', { params }),
  updateVendorStatus: (id, data) => API.put(`/admin/vendors/${id}/status`, data),
  getUsers: (params) => API.get('/admin/users', { params }),
  toggleUser: (id) => API.put(`/admin/users/${id}/toggle`),
  toggleUserStatus: (id) => API.put(`/admin/users/${id}/toggle`), // alias
  getOrders: (params) => API.get('/admin/orders', { params }),
};

// Address API — alias for CheckoutPage which imports addressAPI
export const addressAPI = {
  getAll: () => cartAPI.getAddresses(),
  add: (data) => cartAPI.addAddress(data),
  remove: (id) => cartAPI.deleteAddress(id),
};

// Wishlist API — alias used by ProductDetailPage / ProductsPageNew
export const wishlistAPI = {
  get: () => cartAPI.getWishlist(),
  toggle: (data) => cartAPI.toggleWishlist(data),
};

export default API;
