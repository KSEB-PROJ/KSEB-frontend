/**
 * 회원가입 타입
 * 백엔드의 UserRegisterRequest DTO와 형식을 맞춤
 */
export interface UserUpdateRequest {
  name: string;
}

export interface UserResponse {
  id : number;
  email: string;
  name: string;  
  profileImg: string;
}

export interface PasswordChangeRequest {
  currentPassword: string;
  newPassword: string;  
}