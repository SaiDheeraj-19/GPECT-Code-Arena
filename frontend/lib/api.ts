import axios from 'axios';
import { useAuthStore } from '../store/auth';

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5050/api',
    timeout: 30000,
});

api.interceptors.request.use((config) => {
    const token = useAuthStore.getState().token;
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        const isAuthRoute = error.config?.url?.includes('/auth/login');
        if (error.response?.status === 401 && !isAuthRoute) {
            // Token expired or invalid
            const { logout } = useAuthStore.getState();
            logout();
            if (typeof window !== 'undefined') {
                window.location.href = '/';
            }
        }
        return Promise.reject(error);
    }
);

export default api;

/**
 * WebSocket connection helper for real-time features
 */
export const createWebSocket = (): WebSocket | null => {
    if (typeof window === 'undefined') return null;

    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:5050/ws';
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
        console.log('[WS] Connected');
    };

    ws.onerror = (error) => {
        console.error('[WS] Error:', error);
    };

    ws.onclose = () => {
        console.log('[WS] Disconnected');
    };

    return ws;
};
