import { BACKEND_PORT } from './config.js';

const BASE_URL = `http://localhost:${BACKEND_PORT}`;

/**
 * 内部通用的 fetch 包装函数
 * 负责统一处理 Token、Headers 和 错误检查
 */
const request = async (path, options = {}) => {
    // 1. 准备 URL
    const url = `${BASE_URL}${path}`;

    // 2. 准备 Headers (自动注入 Content-Type)
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    // 3. 自动注入 Token (如果有的话)
    const token = localStorage.getItem('authToken');
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    // 4. 组装 Fetch 配置
    const config = {
        method: options.method || 'GET',
        headers,
        ...options,
    };

    // 自动序列化 Body
    if (config.body && typeof config.body !== 'string') {
        config.body = JSON.stringify(config.body);
    }

    try {
        const response = await fetch(url, config);
        const data = await response.json();

        // 5. 统一错误处理
        if (!response.ok) {
            // 优先使用后端返回的 error 字段，如果没有则使用状态文本
            throw new Error(data.error || `请求失败: ${response.statusText}`);
        }
        return data;
    } catch (error) {
        // 这里可以接入统一的日志系统，或者直接抛出给 UI 处理
        console.error('API Error:', error);
        throw error;
    }
};

/**
 * 导出的 API 对象，按模块分类
 */
export const api = {
    auth: {
        login: (email, password) =>
            request('/auth/login', { method: 'POST', body: { email, password } }),

        register: (email, name, password) =>
            request('/auth/register', { method: 'POST', body: { email, name, password } }),
    },

    user: {
        get: (userId) => request(`/user?userId=${userId}`),

        // 更新个人资料
        update: (data) => request('/user', { method: 'PUT', body: data }),

        // 更新用户权限 (Admin only)
        setAdmin: (userId, turnon) =>
            request('/user/admin', { method: 'PUT', body: { userId, turnon } }),
    },

    thread: {
        create: (title, isPublic, content) =>
            request('/thread', { method: 'POST', body: { title, isPublic, content } }),

        get: (id) => request(`/thread?id=${id}`),

        getList: (start = 0) => request(`/threads?start=${start}`),

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