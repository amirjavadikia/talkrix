import axios from 'axios';

// Create an axios instance
const apiClient = axios.create({
    // baseURL: process.env.REACT_APP_API_URL || 'http://localhost/api',
    baseURL: 'http://localhost/api',
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
});

// Add request interceptor to add auth token to all requests
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

// Add response interceptor to handle token expiration
apiClient.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        if (error.response && error.response.status === 401) {
            // Token expired or invalid
            localStorage.removeItem('token');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

const api = {
    // Authentication
    login: async (email, password) => {
        const response = await apiClient.post('/login', { email, password });
        return response.data;
    },

    register: async (userData) => {
        const response = await apiClient.post('/register', userData);
        return response.data;
    },

    forgotPassword: async (email) => {
        const response = await apiClient.post('/forgot-password', { email });
        return response.data;
    },

    resetPassword: async (token, email, password, password_confirmation) => {
        const response = await apiClient.post('/reset-password', {
            token,
            email,
            password,
            password_confirmation,
        });
        return response.data;
    },

    logout: async () => {
        const response = await apiClient.post('/logout');
        return response.data;
    },

    // User
    getUser: async () => {
        const response = await apiClient.get('/user');
        return response.data;
    },

    updateUser: async (userData) => {
        const response = await apiClient.put('/user', userData);
        return response.data;
    },

    changePassword: async (data) => {
        const response = await apiClient.post('/user/password', data);
        return response.data;
    },

    // Websites
    getWebsites: async () => {
        const response = await apiClient.get('/websites');
        return response.data;
    },

    getWebsite: async (id) => {
        const response = await apiClient.get(`/websites/${id}`);
        return response.data;
    },

    createWebsite: async (data) => {
        const response = await apiClient.post('/websites', data);
        return response.data;
    },

    updateWebsite: async (id, data) => {
        const response = await apiClient.put(`/websites/${id}`, data);
        return response.data;
    },

    deleteWebsite: async (id) => {
        const response = await apiClient.delete(`/websites/${id}`);
        return response.data;
    },

    updateWebsiteSettings: async (id, settings) => {
        const response = await apiClient.put(`/websites/${id}/settings`, settings);
        return response.data;
    },

    regenerateApiKey: async (id) => {
        const response = await apiClient.post(`/websites/${id}/regenerate-key`);
        return response.data;
    },

    // Agents
    getAgents: async () => {
        const response = await apiClient.get('/agents');
        return response.data;
    },

    createAgent: async (data) => {
        const response = await apiClient.post('/agents', data);
        return response.data;
    },

    updateAgent: async (id, data) => {
        const response = await apiClient.put(`/agents/${id}`, data);
        return response.data;
    },

    deleteAgent: async (id) => {
        const response = await apiClient.delete(`/agents/${id}`);
        return response.data;
    },

    toggleAgentStatus: async (id, isActive) => {
        const response = await apiClient.put(`/agents/${id}/status`, { is_active: isActive });
        return response.data;
    },

    // Conversations
    getConversations: async (websiteId, params = {}) => {
        const response = await apiClient.get(`/websites/${websiteId}/conversations`, { params });
        return response.data;
    },

    getConversation: async (id) => {
        const response = await apiClient.get(`/conversations/${id}`);
        return response.data;
    },

    assignConversation: async (id, agentId) => {
        const response = await apiClient.post(`/conversations/${id}/assign`, { agent_id: agentId });
        return response.data;
    },

    closeConversation: async (id) => {
        const response = await apiClient.post(`/conversations/${id}/close`);
        return response.data;
    },

    reopenConversation: async (id) => {
        const response = await apiClient.post(`/conversations/${id}/reopen`);
        return response.data;
    },

    // Messages
    getMessages: async (conversationId) => {
        const response = await apiClient.get(`/conversations/${conversationId}/messages`);
        return response.data;
    },

    sendMessage: async (conversationId, content) => {
        const response = await apiClient.post(`/conversations/${conversationId}/messages`, { content });
        return response.data;
    },

    deleteMessage: async (id) => {
        const response = await apiClient.delete(`/messages/${id}`);
        return response.data;
    },

    markConversationAsRead: async (conversationId) => {
        const response = await apiClient.post('/messages/read', { conversation_id: conversationId });
        return response.data;
    },

    // Visitors
    getVisitors: async (websiteId) => {
        const response = await apiClient.get(`/websites/${websiteId}/visitors`);
        return response.data;
    },

    getVisitor: async (id) => {
        const response = await apiClient.get(`/visitors/${id}`);
        return response.data;
    },

    banVisitor: async (id) => {
        const response = await apiClient.put(`/visitors/${id}/ban`);
        return response.data;
    },

    unbanVisitor: async (id) => {
        const response = await apiClient.put(`/visitors/${id}/unban`);
        return response.data;
    },

    // Canned Responses
    getCannedResponses: async () => {
        const response = await apiClient.get('/canned-responses');
        return response.data;
    },

    createCannedResponse: async (data) => {
        const response = await apiClient.post('/canned-responses', data);
        return response.data;
    },

    updateCannedResponse: async (id, data) => {
        const response = await apiClient.put(`/canned-responses/${id}`, data);
        return response.data;
    },

    deleteCannedResponse: async (id) => {
        const response = await apiClient.delete(`/canned-responses/${id}`);
        return response.data;
    },

    // Auto Replies
    getAutoReplies: async (websiteId) => {
        const response = await apiClient.get(`/websites/${websiteId}/auto-replies`);
        return response.data;
    },

    createAutoReply: async (websiteId, data) => {
        const response = await apiClient.post(`/websites/${websiteId}/auto-replies`, data);
        return response.data;
    },

    updateAutoReply: async (websiteId, id, data) => {
        const response = await apiClient.put(`/websites/${websiteId}/auto-replies/${id}`, data);
        return response.data;
    },

    deleteAutoReply: async (websiteId, id) => {
        const response = await apiClient.delete(`/websites/${websiteId}/auto-replies/${id}`);
        return response.data;
    },

    toggleAutoReply: async (id, isActive) => {
        const response = await apiClient.put(`/auto-replies/${id}/status`, { is_active: isActive });
        return response.data;
    },

    // Settings
    getSettings: async () => {
        const response = await apiClient.get('/settings');
        return response.data;
    },

    updateSettings: async (data) => {
        const response = await apiClient.put('/settings', data);
        return response.data;
    },

    updateNotificationSettings: async (data) => {
        const response = await apiClient.put('/settings/notifications', data);
        return response.data;
    },

    // Analytics
    getAnalytics: async (websiteId, params = {}) => {
        const response = await apiClient.get(`/websites/${websiteId}/analytics`, { params });
        return response.data;
    },

    getConversationAnalytics: async (websiteId, params = {}) => {
        const response = await apiClient.get(`/websites/${websiteId}/analytics/conversations`, { params });
        return response.data;
    },

    getMessageAnalytics: async (websiteId, params = {}) => {
        const response = await apiClient.get(`/websites/${websiteId}/analytics/messages`, { params });
        return response.data;
    },

    getResponseTimeAnalytics: async (websiteId, params = {}) => {
        const response = await apiClient.get(`/websites/${websiteId}/analytics/response-times`, { params });
        return response.data;
    },

    getPeakHoursAnalytics: async (websiteId, params = {}) => {
        const response = await apiClient.get(`/websites/${websiteId}/analytics/peak-hours`, { params });
        return response.data;
    },

    exportAnalytics: async (websiteId, params = {}) => {
        const response = await apiClient.get(`/websites/${websiteId}/analytics/export`, {
            params,
            responseType: 'blob',
        });
        return response.data;
    },
};

export default api;