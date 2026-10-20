import api from './client.js';

/**
 * Thin, named wrappers around the REST API. Centralising the endpoints here
 * keeps components free of raw URLs and makes the API surface easy to scan.
 */

// ---- Auth ----
export const authApi = {
  login: (payload) => api.post('/auth/login', payload).then((r) => r.data),
  register: (payload) => api.post('/auth/register', payload).then((r) => r.data),
  me: () => api.get('/auth/me').then((r) => r.data),
  updateProfile: (payload) => api.put('/auth/me', payload).then((r) => r.data),
};

// ---- Complaints ----
export const complaintApi = {
  options: () => api.get('/complaints/meta/options').then((r) => r.data),
  list: (params) => api.get('/complaints', { params }).then((r) => r.data),
  get: (id) => api.get(`/complaints/${id}`).then((r) => r.data),
  // FormData is used so an optional image can ride along with the complaint.
  create: (formData) =>
    api
      .post('/complaints', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      .then((r) => r.data),
  assign: (id, payload) => api.put(`/complaints/${id}/assign`, payload).then((r) => r.data),
  setPriority: (id, payload) =>
    api.put(`/complaints/${id}/priority`, payload).then((r) => r.data),
  // status update may carry a completion image, so it also uses FormData.
  updateStatus: (id, formData) =>
    api
      .put(`/complaints/${id}/status`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data),
  feedback: (id, payload) =>
    api.post(`/complaints/${id}/feedback`, payload).then((r) => r.data),
};

// ---- Admin ----
export const adminApi = {
  stats: () => api.get('/admin/stats').then((r) => r.data),
  users: (params) => api.get('/admin/users', { params }).then((r) => r.data),
  staff: () => api.get('/admin/staff').then((r) => r.data),
  createStaff: (payload) => api.post('/admin/staff', payload).then((r) => r.data),
  setActive: (id, isActive) =>
    api.patch(`/admin/users/${id}/active`, { isActive }).then((r) => r.data),
  setRole: (id, role) => api.patch(`/admin/users/${id}/role`, { role }).then((r) => r.data),
};
