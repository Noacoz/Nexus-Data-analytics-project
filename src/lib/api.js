// src/lib/api.js — centralized API client

const API_BASE_URL = import.meta.env.VITE_API_URL || '';
const apiUrl = (path) => `${API_BASE_URL.replace(/\/$/, '')}${path}`;

const API = {
  async signup(name, email, password) {
    const res = await fetch(apiUrl('/auth/signup'), {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });
    return res.json();
  },

  async signin(email, password) {
    const res = await fetch(apiUrl('/auth/signin'), {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    return res.json();
  },

  async signout() {
    await fetch(apiUrl('/auth/signout'), { method: 'POST', credentials: 'include' });
  },

  async getMe() {
    const res = await fetch(apiUrl('/auth/me'), { credentials: 'include' });
    if (!res.ok) return { user: null };
    return res.json();
  },

  // OAuth — just redirect the browser
  loginWithGoogle() { window.location.href = '/auth/google'; },
  loginWithGitHub() { window.location.href = '/auth/github'; },

  // Datasets
  async getDatasets() {
    const res = await fetch(apiUrl('/api/datasets'), { credentials: 'include' });
    if (!res.ok) return { datasets: [] };
    const json = await res.json();
    if (!Array.isArray(json.datasets)) return { datasets: [] };
    const normalized = json.datasets.map(d => ({
      ...d,
      rows: d.row_count,
      format: d.file_format,
      createdAt: d.uploaded_at,
    }));
    return { ...json, datasets: normalized };
  },

  async createDataset(data) {
    const res = await fetch(apiUrl('/api/datasets'), {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async deleteDataset(id) {
    const res = await fetch(apiUrl(`/api/datasets/${id}`), { method: 'DELETE', credentials: 'include' });
    return res.json();
  },

  async getInsights(datasetId) {
    const res = await fetch(apiUrl(`/api/datasets/${datasetId}/insights`), { credentials: 'include' });
    if (!res.ok) return { insights: [] };
    return res.json();
  },

  async getReasoning(datasetId) {
    const res = await fetch(apiUrl(`/api/datasets/${datasetId}/reasoning`), { credentials: 'include' });
    if (!res.ok) return { reasoning: null };
    return res.json();
  },

  async getComments(datasetId) {
    const res = await fetch(apiUrl(`/api/datasets/${datasetId}/comments`), { credentials: 'include' });
    if (!res.ok) return { comments: [] };
    return res.json();
  },

  async addComment(datasetId, content) {
    const res = await fetch(apiUrl(`/api/datasets/${datasetId}/comments`), {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });
    return res.json();
  },

  // Reports
  async getReports() {
    const res = await fetch(apiUrl('/api/reports'), { credentials: 'include' });
    if (!res.ok) return { reports: [] };
    return res.json();
  },

  // Notifications
  async getNotifications() {
    const res = await fetch(apiUrl('/api/notifications'), { credentials: 'include' });
    if (!res.ok) return { notifications: [] };
    return res.json();
  },

  async markAllNotificationsRead() {
    await fetch(apiUrl('/api/notifications/read-all'), { method: 'PATCH', credentials: 'include' });
  },

  // Profile
  async updateProfile(data) {
    const res = await fetch(apiUrl('/api/profile'), {
      method: 'PATCH', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  // Auth helpers
  async changePassword(currentPassword, newPassword) {
    const res = await fetch(apiUrl('/auth/change-password'), {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    return res.json();
  },
};

export default API;
