/**
 * @description 인증 및 사용자 정보 관리를 위한 스토어.
 * - 프로필 수정, 비밀번호 변경 등 사용자 관련 API 호출 로직 관리.
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import toast from 'react-hot-toast';
import { AxiosError } from 'axios';
import { jwtDecode } from 'jwt-decode';

import type { UserResponse, UserLoginRequest, PasswordChangeRequest } from '../types';
import { getCurrentUser, updateUserProfile, changePassword as changePasswordApi, deleteProfileImage as deleteProfileImageApi } from '../api/users';
import { login as loginApi } from '../api/auth';


import { useGroupStore } from './groupStore';
import { useChannelStore } from './channelStore';
import { useEventStore } from './eventStore';
import { useTimetableStore } from './timetableStore';

interface DecodedToken {
    userId: number;
    role: string;
    sub: string;
    iat: number;
    exp: number;
}

interface AuthState {
    token: string | null;
    user: (UserResponse & { role?: string }) | null;
    isLoggedIn: boolean;
    login: (loginData: UserLoginRequest) => Promise<boolean>;
    setUser: (user: UserResponse) => void;
    logout: () => void;
    // 프로필 업데이트 액션
    updateProfile: (name: string, profileImg?: File) => Promise<boolean>;
    // 비밀번호 변경 액션
    changePassword: (passwordData: PasswordChangeRequest) => Promise<boolean>;
    // 프로필 이미지 삭제 액션
    deleteProfileImage: () => Promise<boolean>;
}

export const useAuthStore = create<AuthState>()(
    devtools(
        persist(
            (set) => ({
                token: null,
                user: null,
                isLoggedIn: false,

                login: async (loginData) => {
                    try {
                        const response = await toast.promise(
                            loginApi(loginData),
                            {
                                loading: '로그인 중...',
                                success: '로그인 성공! 환영합니다.',
                                error: (err: AxiosError<{ message?: string }>) =>
                                    err.response?.data?.message || '로그인에 실패했습니다.',
                            }
                        );
                        const { token } = response.data.data;
                        const decodedToken = jwtDecode<DecodedToken>(token);
                        
                        set({ token, isLoggedIn: true });
                        
                        const userResponse = await getCurrentUser();
                        set({ user: { ...userResponse.data, role: decodedToken.role } });
                        
                        return true;
                    } catch (error) {
                        console.error("로그인 프로세스 실패:", error);
                        set({ token: null, user: null, isLoggedIn: false });
                        return false;
                    }
                },

                setUser: (user: UserResponse) => set({ user }),
                
                logout: () => {
                    useGroupStore.getState().reset();
                    useChannelStore.getState().reset();
                    useEventStore.getState().reset();
                    useTimetableStore.getState().reset();
                    set({ token: null, user: null, isLoggedIn: false });
                },

                /**
                 * 사용자 프로필(이름, 이미지)을 업데이트.
                 * @param name - 변경할 이름
                 * @param profileImg - 변경할 프로필 이미지 파일
                 * @returns 성공 시 true, 실패 시 false
                 */
                updateProfile: async (name, profileImg) => {
                    let success = false;
                    await toast.promise(
                        updateUserProfile(name, profileImg),
                        {
                            loading: '프로필 정보 수정 중...',
                            success: (res) => {
                                set((state) => ({ user: { ...state.user, ...res.data } }));
                                success = true;
                                return '프로필이 성공적으로 업데이트되었습니다.';
                            },
                            error: (err: AxiosError<{ message?: string }>) =>
                                err.response?.data?.message || '프로필 수정에 실패했습니다.',
                        }
                    );
                    return success;
                },

                /**
                 * 사용자 비밀번호를 변경.
                 * @param passwordData - { currentPassword, newPassword }
                 * @returns 성공 시 true, 실패 시 false
                 */
                changePassword: async (passwordData) => {
                    let success = false;
                    await toast.promise(
                        changePasswordApi(passwordData),
                        {
                            loading: '비밀번호 변경 중...',
                            success: () => {
                                success = true;
                                return '비밀번호가 성공적으로 변경되었습니다.';
                            },
                            error: (err: AxiosError<{ message?: string }>) =>
                                err.response?.data?.message || '비밀번호 변경에 실패했습니다.',
                        }
                    );
                    return success;
                },
                
                /**
                 * 프로필 이미지를 기본 이미지로 되돌림.
                 */
                deleteProfileImage: async () => {
                    // 이미지 삭제는 아직 ui에 없음 추가 예정이기 때문에 미리 기능만 구현.
                    let success = false;
                    await toast.promise(
                        deleteProfileImageApi(),
                        {
                            loading: '프로필 이미지 삭제 중...',
                            success: (res) => {
                                set((state) => ({ user: { ...state.user, ...res.data } }));
                                success = true;
                                return '프로필 이미지가 삭제되었습니다.';
                            },
                            error: '이미지 삭제에 실패했습니다.',
                        }
                    );
                    return success;
                },
            }),
            {
                name: 'auth-storage',
            }
        )
    )
);
