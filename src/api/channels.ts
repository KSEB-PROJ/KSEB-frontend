import axios from 'axios';
import type { ChannelListDto, ChannelCreateRequest } from '../types'; // 아래에서 생성할 타입

const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    withCredentials: true,
});

/**
 * 특정 그룹의 모든 채널 목록을 가져오는 API
 * @param groupId - 조회할 그룹의 ID
 * @returns Promise<ChannelListDto[]>
 */
export const getChannelsByGroup = (groupId: number) => {
    return apiClient.get<ChannelListDto[]>(`/groups/${groupId}/channels`);
};

/**
 * 새로운 채널을 생성하는 API
 * @param groupId - 채널을 생성할 그룹의 ID
 * @param channelData - 생성할 채널의 정보 { name: string, channelTypeId: number }
 * @returns Promise
 */
export const createChannel = (groupId: number, channelData: ChannelCreateRequest) => {
    return apiClient.post(`/groups/${groupId}/channels`, channelData);
};