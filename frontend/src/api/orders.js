import { api } from './client';

export const ordersApi = {
  create:        (data)   => api.post('/orders', data),
  getMyOrders:   (params) => {
    const query = new URLSearchParams(params || {}).toString();
    return api.get(`/orders/my-orders${query ? `?${query}` : ''}`);
  },
  getById:       (id)     => api.get(`/orders/${id}`),
  cancel:        (id)     => api.patch(`/orders/${id}/cancel`),
  getAllOrders:   (params) => {
    const query = new URLSearchParams(params || {}).toString();
    return api.get(`/orders${query ? `?${query}` : ''}`);
  },
  updateStatus:  (id, status) => api.patch(`/orders/${id}/status`, { status }),
};
