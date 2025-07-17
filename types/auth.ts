/**
 * 로그인 타입
 * 백엔드의 UserLoginRequest DTO와 형식을 맞춤
 */
export interface UserLoginRequest {
  email: string;
  password: string;
}

/**
 * 회원가입 타입
 * 백엔드의 UserRegisterRequest DTO와 형식을 맞춤
 */
export interface UserRegisterRequest {
  email: string;
  password: string;
  name: string;
}