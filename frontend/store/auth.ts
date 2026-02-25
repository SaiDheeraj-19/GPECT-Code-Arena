import { create } from 'zustand';
import { jwtDecode } from 'jwt-decode';
import axios from 'axios';

export interface User {
    id: string;
    name?: string;
    username?: string;
    email?: string;
    roll_number?: string;
    bio?: string;
    portfolio_url?: string;
    avatar_url?: string;
    role: 'STUDENT' | 'ADMIN';
    must_change_password?: boolean;
    points?: number;
    streak?: number;
    is_profile_complete?: boolean;
    year?: number;
    semester?: number;
    branch?: string;
    section?: string;
}

export interface AuthState {
    user: User | null;
    token: string | null;
    login: (token: string, user: User) => void;
    updateUser: (user: User) => void;
    logout: () => void;
    initialize: () => Promise<void>;
    refresh: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    token: null,
    login: (token, user) => {
        localStorage.setItem('token', token);
        set({ token, user });
    },
    updateUser: (user) => {
        set({ user });
    },
    logout: () => {
        localStorage.removeItem('token');
        set({ token: null, user: null });
    },
    refresh: async () => {
        const token = localStorage.getItem('token');
        if (!token) return;
        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5050/api';
            const { data } = await axios.get(`${API_URL}/auth/me`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (data.token && data.user) {
                localStorage.setItem('token', data.token);
                set({ token: data.token, user: data.user });
            }
        } catch (e) {
            console.error('Refresh failed:', e);
        }
    },
    initialize: async () => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                // Set initial decoded data immediately
                const decoded = jwtDecode<User>(token);
                set({ token, user: decoded });

                // Fetch fresh user data from server to reflect latest HP/Streak
                const authState = useAuthStore.getState();
                await authState.refresh();
            } catch (error) {
                console.error('Auth init error:', error);
                if (axios.isAxiosError(error) && (error.response?.status === 401 || error.response?.status === 403)) {
                    localStorage.removeItem('token');
                    set({ token: null, user: null });
                }
            }
        }
    }
}));
