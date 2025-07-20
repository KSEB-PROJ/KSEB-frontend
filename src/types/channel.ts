// 백엔드의 ChannelDetailDto 와 유사한 상세 정보 타입
export interface Channel {
    id: number;
    name: string;
    channelTypeId: number;
    channelTypeCode: 'NOTICE' | 'CALENDAR' | 'CHAT' | string;
    channelTypeName: string;
    isSystem: boolean;
    description?: string; // 프론트엔드용 설명 필드 (선택적)
}

// 백엔드의 ChannelListDto 형식
export interface ChannelListDto {
    id: number;
    name: string;
    channelTypeId: number;
    channelTypeCode: string;
    isSystem: boolean;
}

// 백엔드의 ChannelCreateRequest 형식
export interface ChannelCreateRequest {
    name: string;
    channelTypeId: number;
}