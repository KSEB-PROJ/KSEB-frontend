//axios로 연결
import axios from 'axios';
import type { UserLoginRequest, UserRegisterRequest } from '../types';

const apiClient = axios.create({
  baseURL: 'http://localhost:8080/api',
  withCredentials: true,
});

/**
 * 로그인 API 요청 함수
 * @param loginData - 이메일과 비밀번호를 담은 객체
 * @returns Promise - API 요청 결과
 */
export const login = (loginData: UserLoginRequest) => {
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