import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { UserResponse } from '../types'; // 사용자 정보 타입

interface AuthState {
    token: string | null;
    user: UserResponse | null;
    isLoggedIn: boolean;
    setToken: (token: string) => void;
    setUser: (user: UserResponse) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthState>()(
    devtools(
        persist(
            (set) => ({
                token: null,
                user: null,
                isLoggedIn: false,
                setToken: (token: string) => set({ token, isLoggedIn: !!token }),
                setUser: (user: UserResponse) => set({ user }),
                logout: () => set({ token: null, user: null, isLoggedIn: false }),
            }),
            {
                name: 'auth-storage', // localStorage에 저장될 때 사용될 키 이름
            }
        )
    )
);