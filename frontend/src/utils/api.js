const API_BASE = 'http://localhost:5000/api';

const getHeaders = () => {
  const headers = {
    'Content-Type': 'application/json',
  };
  const token = localStorage.getItem('admin_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

const handleResponse = async (res) => {
  if (res.status === 401) {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    // Force reload/navigation to admin login if appropriate
    if (window.location.pathname.startsWith('/admin')) {
      window.location.href = '/admin-login';
    }
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Something went wrong.');
  }
  return data;
};

export const api = {
  get: async (endpoint) => {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },
  post: async (endpoint, body) => {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(body),
    });
    return handleResponse(res);
  },
  put: async (endpoint, body) => {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(body),
    });
    return handleResponse(res);
  },
  patch: async (endpoint, body) => {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(body),
    });
    return handleResponse(res);
  },
  delete: async (endpoint) => {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },
  uploadTemplate: async (eventId, file) => {
    const formData = new FormData();
    formData.append('background', file);
    const token = localStorage.getItem('admin_token');
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const res = await fetch(`${API_BASE}/events/${eventId}/certificate-template`, {
      method: 'POST',
      headers,
      body: formData,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || 'Upload failed.');
    }
    return data;
  },
};
export default api;
