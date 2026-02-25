import { create } from 'zustand';
import { jwtDecode } from 'jwt-decode';

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
}

export interface AuthState {
    user: User | null;
    token: string | null;
    login: (token: string, user: User) => void;
    updateUser: (user: User) => void;
    logout: () => void;
    initialize: () => void;
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
    initialize: () => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const decoded = jwtDecode<User>(token);
                set({ token, user: decoded });
            } catch {
                localStorage.removeItem('token');
                set({ token: null, user: null });
            }
        }
    }
}));
