import apiClient from './index'; // ⭐ 변경: axios 대신 중앙 apiClient import
import type { EventTaskResponse, UpdateTaskRequest } from '../types';

/**
 * API 클라이언트 설정
 * ⭐ 삭제: 중앙 apiClient (src/api/index.ts)로 이동했으므로 삭제합니다.
 */
// const apiClient = axios.create({ ... });

/**
 * 할 일(Task) 수정 API
 * @param taskId - 수정할 할 일의 ID
 * @param data - 수정할 내용
 */
export const updateTask = (taskId: number, data: UpdateTaskRequest) => {
    return apiClient.patch<EventTaskResponse>(`/tasks/${taskId}`, data);
};

/**
 * 할 일(Task) 삭제 API
 * @param taskId - 삭제할 할 일의 ID
 */
export const deleteTask = (taskId: number) => {
    return apiClient.delete(`/tasks/${taskId}`);
};