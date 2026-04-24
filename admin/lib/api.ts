import axios from 'axios';

// Helper to ensure base URL ends with /api
const getBaseUrl = () => {
    const url = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
    // If URL doesn't end with /api, add it
    if (!url.endsWith('/api')) {
        return `${url.replace(/\/$/, '')}/api`;
    }
    return url;
};

const API_BASE_URL = getBaseUrl();

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add token to requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('admin_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Handle 401 errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('admin_token');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export const authAPI = {
    login: (email: string, password: string) => api.post('/auth/login', { email, password }),
};

export const adminAPI = {
    getDashboardStats: () => api.get('/admin/dashboard'),

    // Users
    getUsers: (params?: { page?: number; limit?: number; search?: string }) =>
        api.get('/admin/users', { params }),
    getUserDetails: (id: string) => api.get(`/admin/users/${id}`),
    updateUser: (id: string, data: any) => api.put(`/admin/users/${id}`, data),
    toggleUserStatus: (id: string, is_active: boolean) => api.patch(`/admin/users/${id}/toggle-status`, { is_active }),

    // Bookings
    getBookings: (params?: { page?: number; limit?: number; status?: string; search?: string }) =>
        api.get('/admin/bookings', { params }),
    updateBooking: (id: string, data: any) => api.put(`/admin/bookings/${id}`, data),

    // Professionals
    getProfessionals: () => api.get('/admin/professionals'),
    createProfessional: (data: any) => api.post('/admin/professionals', data),
    updateProfessional: (id: string, data: any) => api.put(`/admin/professionals/${id}`, data),
    deleteProfessional: (id: string) => api.delete(`/admin/professionals/${id}`),

    // Services
    // Services (Level 1)
    getServiceCategories: () => api.get('/admin/services/categories'),
    createServiceCategory: (data: any) => api.post('/admin/services/categories', data),
    updateServiceCategory: (id: string, data: any) => api.put(`/admin/services/categories/${id}`, data),
    deleteServiceCategory: (id: string) => api.delete(`/admin/services/categories/${id}`),

    // Sub-Categories (Level 2)
    getSubCategories: (categoryId: string) => api.get(`/admin/services/subcategories/${categoryId}`),
    createSubCategory: (data: any) => api.post('/admin/services/subcategories', data),
    updateSubCategory: (id: string, data: any) => api.put(`/admin/services/subcategories/${id}`, data),
    deleteSubCategory: (id: string) => api.delete(`/admin/services/subcategories/${id}`),

    // Service Items (Level 3 - Listing)
    getServiceListing: (subCategoryId: string) => api.get(`/admin/services/listing/${subCategoryId}`),
    getServiceItems: (categoryId: string) => api.get(`/admin/services/items/${categoryId}`), // Legacy
    createServiceItem: (data: any) => api.post(`/admin/services/items`, data),
    updateServiceItem: (id: string, data: any) => api.put(`/admin/services/items/${id}`, data),
    deleteServiceItem: (id: string) => api.delete(`/admin/services/items/${id}`),

    // Vendors
    getPendingVendors: () => api.get('/admin/vendors/pending'),
    getAllVendors: (params?: { status?: string }) => api.get('/admin/vendors', { params }),
    approveVendor: (id: string) => api.put(`/admin/vendors/${id}/approve`),
    rejectVendor: (id: string) => api.put(`/admin/vendors/${id}/reject`),
    toggleVendorStatus: (id: string, is_active: boolean) => api.patch(`/admin/vendors/${id}/toggle-status`, { is_active }),
    assignServiceToVendor: (data: { vendorId: string; serviceItemId: string; customPrice?: string }) =>
        api.post('/admin/services/assign-vendor', data),
    // Vendor Service Pricing (Admin control)
    getVendorServicePricing: (vendorId: string) => api.get(`/admin/vendors/${vendorId}/service-pricing`),
    updateVendorServicePricing: (vendorId: string, data: { serviceItemId: string; customPrice?: string; customDuration?: number | null; isEnabled?: boolean }) =>
        api.put(`/admin/vendors/${vendorId}/service-pricing`, data),

    // Payments
    getPayments: () => api.get('/admin/payments'),

    // Offers / Ads / Job Openings
    getOffers: () => api.get('/admin/offers'),
    createOffer: (data: any) => api.post('/admin/offers', data),
    updateOffer: (id: string, data: any) => api.put(`/admin/offers/${id}`, data),
    deleteOffer: (id: string) => api.delete(`/admin/offers/${id}`),
};

export default api;
