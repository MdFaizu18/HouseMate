const API_BASE = import.meta.env.VITE_API_URL || '/api';

class ApiError extends Error {
  constructor(message, status, errors = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors;
  }
}

function getToken() {
  return localStorage.getItem('accessToken');
}

function setToken(token) {
  if (token) localStorage.setItem('accessToken', token);
  else localStorage.removeItem('accessToken');
}

async function request(path, options = {}) {
  const { method = 'GET', body, auth = true } = options;
  const headers = { 'Content-Type': 'application/json' };

  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : method !== 'GET' && method !== 'HEAD' ? '{}' : undefined,
    credentials: 'include',
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    // Stale JWT after re-seed or expired session — clear and force re-login
    if (res.status === 401 && auth) {
      setToken(null);
      window.dispatchEvent(new CustomEvent('auth:logout'));
    }
    throw new ApiError(data.message || 'Request failed', res.status, data.errors);
  }

  return data;
}

export const api = {
  setToken,
  getToken,

  // Auth
  login: (email, password) =>
    request('/auth/login', { method: 'POST', body: { email, password }, auth: false }),
  register: (name, email, password) =>
    request('/auth/register', { method: 'POST', body: { name, email, password }, auth: false }),
  getMe: () => request('/auth/me'),
  updateProfile: (body) => request('/auth/me', { method: 'PUT', body }),
  logout: () => request('/auth/logout', { method: 'POST' }),

  // House
  getMyHouse: () => request('/houses/me'),
  getLeaderboard: () => request('/houses/me/leaderboard'),
  getHouseMembers: () => request('/users/house-members'),

  // Users
  getMyProfile: () => request('/users/me/profile'),

  // Tasks
  getTasks: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/tasks${qs ? `?${qs}` : ''}`);
  },
  getTodayTasks: () => request('/tasks/today'),
  getTaskAnalytics: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/tasks/analytics${qs ? `?${qs}` : ''}`);
  },
  completeTask: (id) => request(`/tasks/${id}/complete`, { method: 'POST' }),
  requestAssist: (id) => request(`/tasks/${id}/assist/request`, { method: 'POST' }),
  acceptAssist: (id) => request(`/tasks/${id}/assist/accept`, { method: 'POST' }),
  requestSwap: (id, body) => request(`/tasks/${id}/swap/request`, { method: 'POST', body }),
  requestSickLeave: (id, body) => request(`/tasks/${id}/sick`, { method: 'POST', body }),
  postToMarketplace: (id) => request(`/tasks/${id}/marketplace`, { method: 'POST' }),
  claimTask: (id) => request(`/tasks/${id}/claim`, { method: 'POST' }),

  // Expenses
  getExpenses: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/expenses${qs ? `?${qs}` : ''}`);
  },
  getExpenseSummary: (month) =>
    request(`/expenses/summary${month ? `?month=${month}` : ''}`),
  createExpense: (body) => request('/expenses', { method: 'POST', body }),
  settleExpense: (id, body) => request(`/expenses/${id}/settle`, { method: 'POST', body }),

  // Inventory
  getInventory: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/inventory${qs ? `?${qs}` : ''}`);
  },
  requestRefill: (id) => request(`/inventory/${id}/refill`, { method: 'POST' }),
  createInventoryItem: (body) => request('/inventory', { method: 'POST', body }),

  // Notifications
  getNotifications: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/notifications${qs ? `?${qs}` : ''}`);
  },
  markNotificationsRead: (ids) =>
    request('/notifications/read', { method: 'PUT', body: { ids } }),
  getUnreadCount: () => request('/notifications/count'),
};

export { ApiError, getToken, setToken };
