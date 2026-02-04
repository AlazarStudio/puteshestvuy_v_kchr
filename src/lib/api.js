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
});

// Request interceptor - добавляем токен к каждому запросу
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('adminToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - обработка ошибок
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('adminToken');
        window.location.href = '/admin/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
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
  upload: (formData) => api.post('/admin/media/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  delete: (id) => api.delete(`/admin/media/${id}`),
};

// Statistics API
export const statsAPI = {
  getDashboard: () => api.get('/admin/stats'),
};

export default api;
