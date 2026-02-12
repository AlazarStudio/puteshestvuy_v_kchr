import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api')?.replace('/api', '') || 'http://localhost:5000';

// Хелпер для получения полного URL изображения
export const getImageUrl = (path) => {
  if (!path) return '/placeholder.jpg';
  if (path.startsWith('http')) return path;
  return `${BASE_URL}${path}`;
};

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Включаем отправку cookies
});

const USER_TOKEN_KEY = 'token';

// Request interceptor: используем один токен для всех запросов
api.interceptors.request.use(
  (config) => {
    if (typeof window === 'undefined') return config;
    // Используем основной токен для всех запросов
    const token = localStorage.getItem(USER_TOKEN_KEY) || localStorage.getItem('adminToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: 401 — очищаем токены и редиректим
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      const url = error.config?.url || '';
      // Очищаем все токены
      localStorage.removeItem(USER_TOKEN_KEY);
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUser');
      
      // Отправляем событие для AuthContext
      window.dispatchEvent(new CustomEvent('user-unauthorized'));
      
      // Редиректим на логин с returnUrl
      if (url.includes('/admin')) {
        const currentPath = window.location.pathname;
        window.location.href = `/login?returnUrl=${encodeURIComponent(currentPath)}`;
      }
    }
    return Promise.reject(error);
  }
);

// Auth API (public user)
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
};

// User API (profile + favorites, requires user token)
export const userAPI = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data) => api.put('/users/profile', data),
  uploadAvatar: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/users/profile/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  getFavorites: () => api.get('/users/profile/favorites'),
  getConstructorPoints: () => api.get('/users/constructor-points'),
  updateConstructorPoints: (placeIds) =>
    api.put('/users/constructor-points', { placeIds }),
  addFavorite: (entityType, entityId) =>
    api.post(`/users/favorites/${entityType}/${entityId}`),
  removeFavorite: (entityType, entityId) =>
    api.delete(`/users/favorites/${entityType}/${entityId}`),
};

export { USER_TOKEN_KEY };

// User Routes API (пользовательские маршруты в профиле)
export const userRoutesAPI = {
  getAll: () => api.get('/users/routes'),
  getById: (id) => api.get(`/users/routes/${id}`),
  create: (data) => api.post('/users/routes', data),
  update: (id, data) => api.put(`/users/routes/${id}`, data),
  delete: (id) => api.delete(`/users/routes/${id}`),
};

// Routes API
export const routesAPI = {
  getAll: (params) => api.get('/admin/routes', { params }),
  getById: (id) => api.get(`/admin/routes/${id}`),
  create: (data) => api.post('/admin/routes', data),
  update: (id, data) => api.put(`/admin/routes/${id}`, data),
  delete: (id) => api.delete(`/admin/routes/${id}`),
};

// Places API (admin)
export const placesAPI = {
  getAll: (params) => api.get('/admin/places', { params }),
  getById: (id) => api.get(`/admin/places/${id}`),
  create: (data) => api.post('/admin/places', data),
  update: (id, data) => api.put(`/admin/places/${id}`, data),
  delete: (id) => api.delete(`/admin/places/${id}`),
}

// Places API (public, для страницы «Интересные места»)
export const publicPlacesAPI = {
  getAll: (params) => api.get('/places', { params }),
  getByIdOrSlug: (idOrSlug) => api.get(`/places/${idOrSlug}`),
  getFilters: () => api.get('/places/filters'),
  createReview: (placeId, data) => api.post(`/places/${placeId}/reviews`, data),
};

// Routes API (public, для страницы «Маршруты» и страницы маршрута)
export const publicRoutesAPI = {
  getAll: (params) => api.get('/routes', { params }),
  getByIdOrSlug: (idOrSlug) => api.get(`/routes/${idOrSlug}`),
  getFilters: () => api.get('/routes/filters'),
  createReview: (routeId, data) => api.post(`/routes/${routeId}/reviews`, data),
};

// Place filters API (админка — управление опциями фильтров)
export const placeFiltersAPI = {
  get: () => api.get('/admin/place-filters'),
  update: (data) => api.put('/admin/place-filters', data),
  addGroup: (label, icon = null, iconType = null, values = []) =>
    api.post('/admin/place-filters/add-group', { label, icon: icon || undefined, iconType: iconType || undefined, values }),
  removeGroup: (key) => api.post('/admin/place-filters/remove-group', { key }),
  updateGroupMeta: (key, { label, icon, iconType }) =>
    api.patch('/admin/place-filters/group-meta', { key, label, icon, iconType }),
  replaceValue: (group, oldValue, newValue) =>
    api.post('/admin/place-filters/replace-value', { group, oldValue, newValue }),
  removeValue: (group, value) => api.post('/admin/place-filters/remove-value', { group, value }),
};

// Route filters API (админка — управление опциями фильтров маршрутов)
export const routeFiltersAPI = {
  get: () => api.get('/admin/route-filters'),
  update: (data) => api.put('/admin/route-filters', data),
  addGroup: (label, icon = null, iconType = null, values = []) =>
    api.post('/admin/route-filters/add-group', { label, icon: icon || undefined, iconType: iconType || undefined, values }),
  removeGroup: (key) => api.post('/admin/route-filters/remove-group', { key }),
  updateGroupMeta: (key, { label, icon, iconType }) =>
    api.patch('/admin/route-filters/group-meta', { key, label, icon, iconType }),
  replaceValue: (group, oldValue, newValue) =>
    api.post('/admin/route-filters/replace-value', { group, oldValue, newValue }),
  removeValue: (group, value) => api.post('/admin/route-filters/remove-value', { group, value }),
};

// News API (admin)
export const newsAPI = {
  getAll: (params) => api.get('/admin/news', { params }),
  getById: (id) => api.get(`/admin/news/${id}`),
  create: (data) => api.post('/admin/news', data),
  update: (id, data) => api.put(`/admin/news/${id}`, data),
  delete: (id) => api.delete(`/admin/news/${id}`),
};

// News API (public — для страницы «Новости и статьи»)
export const publicNewsAPI = {
  getAll: (params) => api.get('/news', { params }),
  getByIdOrSlug: (idOrSlug) => api.get(`/news/${idOrSlug}`),
};

// Services API (admin)
export const servicesAPI = {
  getAll: (params) => api.get('/admin/services', { params }),
  getById: (id) => api.get(`/admin/services/${id}`),
  create: (data) => api.post('/admin/services', data),
  update: (id, data) => api.put(`/admin/services/${id}`, data),
  delete: (id) => api.delete(`/admin/services/${id}`),
};

// Services API (public — для страницы «Услуги» на сайте)
export const publicServicesAPI = {
  getAll: (params) => api.get('/services', { params }),
  getByIdOrSlug: (idOrSlug) => api.get(`/services/${idOrSlug}`),
  createReview: (serviceId, data) => api.post(`/services/${serviceId}/reviews`, data),
};

// Reviews API
export const reviewsAPI = {
  getAll: (params) => api.get('/admin/reviews', { params }),
  getById: (id) => api.get(`/admin/reviews/${id}`),
  update: (id, data) => api.put(`/admin/reviews/${id}`, data),
  delete: (id) => api.delete(`/admin/reviews/${id}`),
};

// Media API
export const mediaAPI = {
  upload: (formData, { onUploadProgress } = {}) => api.post('/admin/media/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress,
  }),
  uploadDocument: (formData) => api.post('/admin/media/upload-document', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  uploadVideo: (formData, { onUploadProgress } = {}) => api.post('/admin/media/upload-video', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress,
  }),
  delete: (id) => api.delete(`/admin/media/${id}`),
};

// Statistics API
export const statsAPI = {
  getDashboard: () => api.get('/admin/stats'),
};

// Region API (страница «О регионе»)
export const regionAPI = {
  get: () => api.get('/admin/region'),
  update: (content) => api.put('/admin/region', { content }),
};

// Region API (public — для страницы «О регионе»)
export const publicRegionAPI = {
  get: () => api.get('/region'),
};

// Home API (главная страница)
export const homeAPI = {
  get: () => api.get('/admin/home'),
  update: (content) => api.put('/admin/home', { content }),
};

// Home API (public — для главной страницы)
export const publicHomeAPI = {
  get: () => api.get('/home'),
};

// Footer API (admin)
export const footerAPI = {
  get: () => api.get('/admin/footer'),
  update: (content) => api.put('/admin/footer', { content }),
};

// Footer API (public — для футера сайта)
export const publicFooterAPI = {
  get: () => api.get('/footer', { params: { _t: Date.now() }, headers: { 'Cache-Control': 'no-cache', Pragma: 'no-cache' } }),
};

// Feedback API (форма обратной связи в футере)
export const feedbackAPI = {
  send: (data) => api.post('/footer/feedback', data),
};

// Pages API (admin — для управления страницами сайта)
export const pagesAPI = {
  get: (pageName) => api.get(`/admin/pages/${pageName}`),
  update: (pageName, content) => api.put(`/admin/pages/${pageName}`, { content }),
};

// Users API (admin — для управления пользователями)
export const adminUsersAPI = {
  getAll: (params) => api.get('/admin/users', { params }),
  getById: (id) => api.get(`/admin/users/${id}`),
  updateRole: (id, role) => api.put(`/admin/users/${id}/role`, { role }),
  ban: (id) => api.put(`/admin/users/${id}/ban`),
  unban: (id) => api.put(`/admin/users/${id}/unban`),
};

// Pages API (public — для страниц сайта)
export const publicPagesAPI = {
  get: (pageName) => api.get(`/pages/${pageName}`),
};

export default api;
