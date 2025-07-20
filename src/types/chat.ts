// 백엔드의 ChatResponse DTO 형식
export interface ChatMessageResponse {
    id: number;
    channelId: number;
    userId: number;
    userName: string;
    content?: string;
    messageType: string;
    fileUrl?: string;
    fileName?: string;
    isMine: boolean;
    createdAt: string;
}

// 백엔드의 ChatRequest DTO 형식
export interface ChatMessageRequest {
    content: string;
    messageTypeId: number; // 1: TEXT
    // 파일 관련 정보는 FormData로 처리
}