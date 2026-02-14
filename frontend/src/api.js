import { BACKEND_PORT } from './config.js';

const BASE_URL = `http://localhost:${BACKEND_PORT}`;

const request = async (path, options = {}) => {
    const url = `${BASE_URL}${path}`;

    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    const token = localStorage.getItem('authToken');
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
        method: options.method || 'GET',
        headers,
        ...options,
    };

    if (config.body && typeof config.body !== 'string') {
        config.body = JSON.stringify(config.body);
    }

    try {
        const response = await fetch(url, config);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || `请求失败: ${response.statusText}`);
        }
        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
};

export const api = {
    auth: {
        login: (email, password) =>
            request('/auth/login', { method: 'POST', body: { email, password } }),

        register: (email, name, password) =>
            request('/auth/register', { method: 'POST', body: { email, name, password } }),
    },

    user: {
        get: (userId) => request(`/user?userId=${userId}`),

        update: (data) => request('/user', { method: 'PUT', body: data }),

        setAdmin: (userId, turnon) =>
            request('/user/admin', { method: 'PUT', body: { userId, turnon } }),
    },

    thread: {
        create: (title, isPublic, content) =>
            request('/thread', { method: 'POST', body: { title, isPublic, content } }),

        get: (id) => request(`/thread?id=${id}`),

        getList: (start, limit = 10, sortBy = 'recent') =>
            request(`/threads?start=${start}&limit=${limit}&sortBy=${sortBy}`),

        update: (id, title, content, isPublic, lock) =>
            request('/thread', { method: 'PUT', body: { id, title, content, isPublic, lock } }),

        delete: (id) => request('/thread', { method: 'DELETE', body: { id } }),

        like: (id, turnon) => request('/thread/like', { method: 'PUT', body: { id, turnon } }),

        watch: (id, turnon) => request('/thread/watch', { method: 'PUT', body: { id, turnon } }),
    },

    comment: {
        list: (threadId) => request(`/comments?threadId=${threadId}`),

        create: (content, threadId, parentCommentId) =>
            request('/comment', { method: 'POST', body: { content, threadId, parentCommentId } }),

        update: (id, content) => request('/comment', { method: 'PUT', body: { id, content } }),

        delete: (id) => request('/comment', { method: 'DELETE', body: { id } }),

        like: (id, turnon) => request('/comment/like', { method: 'PUT', body: { id, turnon } }),
    }
};