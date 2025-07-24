import axios from 'axios';
import type { EventTaskResponse, UpdateTaskRequest } from '../types';

const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    withCredentials: true,
});

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