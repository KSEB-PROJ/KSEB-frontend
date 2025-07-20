import axios from 'axios';
import type { ChatMessageResponse, ChatMessageRequest } from '../types';

const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    withCredentials: true,
});

/**
 * 특정 채널의 메시지 목록을 가져오는 API
 * @param channelId - 조회할 채널의 ID
 */
export const getMessages = (channelId: number) => {
    return apiClient.get<ChatMessageResponse[]>(`/channels/${channelId}/messages`);
};

/**
 * 메시지와 파일을 전송하는 API
 * @param channelId - 메시지를 보낼 채널의 ID
 * @param messageData - 메시지 내용과 파일
 */
export const sendMessage = (channelId: number, messageData: { content: string; file?: File }) => {
    const formData = new FormData();

    // 1. 메시지 DTO를 JSON 문자열로 변환하여 추가
    const messageRequest: ChatMessageRequest = {
        content: messageData.content,
        messageTypeId: 1, // 'TEXT' 타입으로 가정
    };
    formData.append('message', JSON.stringify(messageRequest));

    // 2. 파일이 있으면 파일 추가
    if (messageData.file) {
        formData.append('file', messageData.file);
    }

    return apiClient.post<ChatMessageResponse>(`/channels/${channelId}/messages`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
};

/**
 * 메시지를 수정하는 API
 * @param channelId - 채널 ID
 * @param messageId - 수정할 메시지 ID
 * @param content - 새로운 메시지 내용
 */
export const updateMessage = (channelId: number, messageId: number, content: string) => {
    const messageRequest: Partial<ChatMessageRequest> = {
        content: content,
        messageTypeId: 1,
    };
    return apiClient.patch<ChatMessageResponse>(`/channels/${channelId}/messages/${messageId}`, messageRequest);
};

/**
 * 메시지를 삭제하는 API
 * @param channelId - 채널 ID
 * @param messageId - 삭제할 메시지 ID
 */
export const deleteMessage = (channelId: number, messageId: number) => {
    return apiClient.delete(`/channels/${channelId}/messages/${messageId}`);
};