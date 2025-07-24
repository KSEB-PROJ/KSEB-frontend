import apiClient from './index';
import type { UserUpdateRequest, PasswordChangeRequest, UserResponse } from '../types';

/**
 * 사용자 프로필 정보(이름)와 이미지 파일을 함께 업데이트하는 API
 * @param name - 변경할 새로운 이름
 * @param profileImg - 업로드할 프로필 이미지 File 객체
 * @returns Promise<UserResponse>
 */
export const updateUserProfile = (name?: string, profileImg?: File) => {
    const formData = new FormData();

    // 이름 데이터
    const updateDto: UserUpdateRequest = { name: name || '' };
    // DTO 객체를 JSON 문자열로 변환하고 Blob으로 감싸서 Content-Type을 지정.
    formData.append('dto', new Blob([JSON.stringify(updateDto)], { type: "application/json" }));

    // 이미지 파일 추가 (파일이 존재할 경우)
    if (profileImg) {
        formData.append('profileImg', profileImg);
    }

    return apiClient.patch<UserResponse>('/users/me', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
};


/**
 * 비밀번호 변경 API
 * @param data - 현재 비밀번호와 새 비밀번호
 * @returns Promise
 */
export const changePassword = (data: PasswordChangeRequest) => {
    return apiClient.patch('/users/me/password', data);
};

/**
 * 프로필 이미지 삭제 API
 * @returns Promise<UserResponse>
 */
export const deleteProfileImage = () => {
    return apiClient.delete<UserResponse>('/users/me/profile-image');
};

/**
 * 현재 로그인된 사용자의 정보를 가져오는 API
 * @returns Promise<UserResponse>
 */
export const getCurrentUser = () => {
    return apiClient.get<UserResponse>('/users/me');
};