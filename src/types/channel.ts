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