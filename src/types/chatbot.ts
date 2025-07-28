/**
 * @description 챗봇 UI에서 사용되는 메시지 객체 타입
 */
export interface ChatMessage {
    author: 'user' | 'ai';
    text: string;
}

/**
 * @description 챗봇 API 요청 시 사용되는 DTO 형식
 */
export interface ChatRequest {
    query: string;
}