//axios로 연결
import axios from 'axios';
// 데이터 타입
import type { UserLoginRequest, UserRegisterRequest } from '../types';

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
 * 로그인 API 요청 함수
 * @param loginData - 이메일과 비밀번호를 담은 객체
 * @returns Promise - API 요청 결과
 */
export const login = (loginData: UserLoginRequest) => {
    // apiClient를 사용해 '/auth/login' 경로로 POST 방식의 api 전송
    return apiClient.post('/auth/login', loginData);
};

/**
 * 회원가입 API 요청 함수
 * @param registerData - 이메일, 비밀번호, 이름을 담은 객체
 * @returns Promise - API 요청 결과
 */
export const register = (registerData: UserRegisterRequest) => {
    return apiClient.post('/auth/register', registerData);
};