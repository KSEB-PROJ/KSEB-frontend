import axios from 'axios';
import { useAuthStore } from '../stores/authStore';
import type { ChatRequest } from '../types'; // 'import type'으로 수정

const chatbotApi = axios.create({
    baseURL: import.meta.env.VITE_CHATBOT_API_BASE_URL,
});

// 요청 인터셉터를 사용하여 apiClient와 동일한 방식으로 JWT 토큰을 헤더에 추가
chatbotApi.interceptors.request.use(
    (config) => {
        // [수정] localStorage 대신 authStore에서 토큰을 가져옵니다.
        const { token } = useAuthStore.getState();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

/**
 * AI 에이전트에게 사용자의 질문(query)을 보내고 답변을 받습니다.
 */
export const postChatQuery = (groupId: number, channelId: number, data: ChatRequest) => {
    // baseURL에 /api/v1/chatbot이 이미 포함되어 있으므로, 나머지 경로만 적어줍니다.
    return chatbotApi.post(`/groups/${groupId}/channels/${channelId}/query`, data);
};