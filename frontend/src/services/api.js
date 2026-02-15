import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add token to requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Handle 401 errors (unauthorized)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// Authentication
export const authAPI = {
    register: (data) => api.post('/auth/register', data),
    login: (data) => api.post('/auth/login', data),
};

// Quarterly Goals
export const goalsAPI = {
    getAll: () => api.get('/quarterly-goals'),
    create: (data) => api.post('/quarterly-goals', data),
    update: (id, data) => api.put(`/quarterly-goals/${id}`, data),
    delete: (id) => api.delete(`/quarterly-goals/${id}`),
};

// Monthly Plans
export const plansAPI = {
    getAll: (quarterlyGoalId) => api.get('/monthly-plans', { params: { quarterly_goal_id: quarterlyGoalId } }),
    create: (data) => api.post('/monthly-plans', data),
    update: (id, data) => api.put(`/monthly-plans/${id}`, data),
    delete: (id) => api.delete(`/monthly-plans/${id}`),
};

// Weekly Tasks
export const tasksAPI = {
    getAll: (monthlyPlanId, status) => api.get('/weekly-tasks', { params: { monthly_plan_id: monthlyPlanId, status } }),
    create: (data) => api.post('/weekly-tasks', data),
    update: (id, data) => api.put(`/weekly-tasks/${id}`, data),
    delete: (id) => api.delete(`/weekly-tasks/${id}`),
};

// Time Logs
export const timeLogsAPI = {
    getAll: (taskId) => api.get('/time-logs', { params: { task_id: taskId } }),
    create: (data) => api.post('/time-logs', data),
};

// Notifications
export const notificationsAPI = {
    getAll: () => api.get('/notifications'),
    markAsRead: (id) => api.put(`/notifications/${id}/read`),
    markAllAsRead: () => api.put('/notifications/read-all'),
};

// Dashboard
export const dashboardAPI = {
    getStats: () => api.get('/dashboard/stats'),
    getTeamPerformance: () => api.get('/dashboard/team-performance'),
};

export default api;
