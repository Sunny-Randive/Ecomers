import axios from 'axios';

// Base URL for the live GCP API Gateway
const API_BASE_URL = 'http://34.47.52.111';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Automatically inject JWT token into requests if available
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const authService = {
  login: async (username, password) => {
    const response = await apiClient.post('/api/v1/auth/login', { username, password });
    if (response.data && response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('refreshToken', response.data.refreshToken);
      localStorage.setItem('userId', response.data.userId);
      localStorage.setItem('username', response.data.username);
    }
    return response.data;
  },
  
  register: async (username, email, password) => {
    const response = await apiClient.post('/api/v1/auth/register', { username, email, password });
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userId');
    localStorage.removeItem('username');
  },

  getCurrentUser: () => {
    const token = localStorage.getItem('token');
    const username = localStorage.getItem('username');
    const userId = localStorage.getItem('userId');
    if (token && username) {
      return { token, username, userId };
    }
    return null;
  }
};

export const productService = {
  getProducts: async (search = '', categoryId = null, page = 0, size = 10) => {
    const params = { page, size };
    if (search) params.search = search;
    if (categoryId) params.categoryId = categoryId;
    const response = await apiClient.get('/api/v1/products', { params });
    return response.data;
  },

  getProductById: async (id) => {
    const response = await apiClient.get(`/api/v1/products/${id}`);
    return response.data;
  },

  getCategories: async () => {
    const response = await apiClient.get('/api/v1/products/categories');
    return response.data;
  }
};

export const userService = {
  getProfile: async () => {
    const response = await apiClient.get('/api/v1/users/profile');
    return response.data;
  },

  getAddresses: async () => {
    const response = await apiClient.get('/api/v1/users/addresses');
    return response.data;
  },

  createAddress: async (addressDto) => {
    const response = await apiClient.post('/api/v1/users/addresses', addressDto);
    return response.data;
  }
};

export const cartService = {
  getCart: async () => {
    const response = await apiClient.get('/api/v1/cart');
    return response.data;
  },

  addItemToCart: async (productId, quantity = 1) => {
    const response = await apiClient.post('/api/v1/cart', { productId, quantity });
    return response.data;
  },

  updateQuantity: async (itemId, quantity) => {
    const response = await apiClient.put(`/api/v1/cart/${itemId}`, null, {
      params: { quantity }
    });
    return response.data;
  },

  removeItemFromCart: async (itemId) => {
    const response = await apiClient.delete(`/api/v1/cart/${itemId}`);
    return response.data;
  },

  clearCart: async () => {
    const response = await apiClient.delete('/api/v1/cart/clear');
    return response.data;
  }
};

export const orderService = {
  getUserOrders: async () => {
    const response = await apiClient.get('/api/v1/orders');
    return response.data;
  },

  getOrderDetails: async (orderId) => {
    const response = await apiClient.get(`/api/v1/orders/${orderId}`);
    return response.data;
  },

  checkout: async (shippingAddressId, paymentMethod = 'CREDIT_CARD') => {
    const response = await apiClient.post('/api/v1/orders/checkout', {
      shippingAddressId,
      paymentMethod
    });
    return response.data;
  },

  cancelOrder: async (orderId) => {
    const response = await apiClient.post(`/api/v1/orders/${orderId}/cancel`);
    return response.data;
  }
};

export default apiClient;
