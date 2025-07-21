// 백엔드의 NoticeResponse DTO 형식
export interface Notice {
    id: number;
    groupId: number;
    channelId: number;
    userId: number;
    userName: string; // author 대신 userName 사용
    content: string;
    sourceMessageId?: number | null;
    pinnedUntil?: string | null; // isPinned 대신 pinnedUntil 사용 (null이 아니면 고정)
    createdAt: string;
    updatedAt?: string | null;
    originChannel?: string; // 프론트엔드에서 임시로 사용할 채널명
}

// 백엔드의 NoticeCreateRequest DTO 형식
export interface NoticeCreateRequest {
    channelId: number;
    content: string;
    pinnedUntil?: string | null;
}

// 백엔드의 NoticeUpdateRequest DTO 형식
export interface NoticeUpdateRequest {
    content?: string;
    pinnedUntil?: string | null;
}

// 백엔드의 NoticePinRequest 와 유사 (실제로는 UpdateRequest 사용)
export interface NoticePinRequest {
    pinnedUntil: string | null;
}

// 백엔드의 NoticePromoteRequest DTO 형식
export interface NoticePromoteRequest {
    pinnedUntil?: string | null;
}