// 백엔드의 ChatResponse DTO 형식
export interface ChatMessageResponse {
    id: number;
    channelId: number;
    userId: number;
    userName: string;
    profileImgUrl?: string; // 프로필 이미지 URL 필드 추가
    content?: string;
    messageType: 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT';
    fileUrl?: string;
    fileName?: string;
    createdAt: string;
    deleted?: boolean;
}

// 백엔드의 ChatRequest DTO 형식
export interface ChatMessageRequest {
    content: string;
    messageTypeId: number; // 1: TEXT
    // 파일 관련 정보는 FormData로 처리
}