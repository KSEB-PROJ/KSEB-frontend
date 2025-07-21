//axios로 연결
import axios from 'axios';
// 데이터 타입
import type { UserUpdateRequest,UserResponse,PasswordChangeRequest } from '../types';

/**
 * API 클라이언트 설정
 * - baseURL: 모든 요청에 기본적으로 사용될 서버 주소.
 * - withCredentials: 요청 시 쿠키 같은 인증 정보를 함께 보내주는 설정입니다.
 */
const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    withCredentials: true,
});

/**
 * 이름 변경 API 요청 함수
 * @param newName - 새로운 이름을 담은 객체
 * @returns Promise - API 요청 결과
 */
export const me = (newName: UserUpdateRequest) => {
    // apiClient를 사용해 '/users/me' 경로로 patch 방식의 api 전송
    return apiClient.patch('/users/me', newName);
};

/**
 * 이름 변경 API 요청 함수
 * @param newName - 새로운 이름을 담은 객체
 * @returns Promise - API 요청 결과
 */
export const changePassword = (newPassword: PasswordChangeRequest) => {
    // apiClient를 사용해 '/users/me' 경로로 patch 방식의 api 전송
    return apiClient.patch('/users/me/password', newPassword);
};

/**
 * 프로필 이미지 변경 API 요청 함수
 * @param profileImg - 프로필 이미지를 담은 객체
 * @returns Promise - API 요청 결과
 */
export const myemail  = (email: UserResponse) => {
    // apiClient를 사용해 '/auth/login' 경로로 patch 방식의 api 전송
    return apiClient.patch('/users/me', email);
};

/**
 * 프로필 이미지 변경 API 요청 함수
 * @param profileImg - 프로필 이미지를 담은 객체
 * @returns Promise - API 요청 결과
 */
export const profileImage  = (profileImg: UserResponse) => {
    // apiClient를 사용해 '/auth/login' 경로로 patch 방식의 api 전송
    return apiClient.patch('/users/me', profileImg);
};
