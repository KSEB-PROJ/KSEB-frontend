import apiClient from './index'; // ⭐ 변경: axios 대신 중앙 apiClient import
import type { ChannelListDto, ChannelCreateRequest, Channel } from '../types';

/**
 * API 클라이언트 설정
 * ⭐ 삭제: 중앙 apiClient (src/api/index.ts)로 이동했으므로 삭제합니다.
 */
// const apiClient = axios.create({ ... });

/**
 * 특정 그룹의 모든 채널 목록을 가져오는 API
 * @param groupId - 조회할 그룹의 ID
 * @returns Promise<ChannelListDto[]>
 */
export const getChannelsByGroup = (groupId: number) => {
    return apiClient.get<ChannelListDto[]>(`/groups/${groupId}/channels`);
};

/**
 * 특정 채널의 상세 정보를 가져오는 API
 * @param groupId - 그룹 ID
 * @param channelId - 채널 ID
 */
export const getChannelDetail = (groupId: number, channelId: number) => {
    return apiClient.get<Channel>(`/groups/${groupId}/channels/${channelId}`);
}


/**
 * 새로운 채널을 생성하는 API
 * @param groupId - 채널을 생성할 그룹의 ID
 * @param channelData - 생성할 채널의 정보 { name: string, channelTypeId: number }
 * @returns Promise
 */
export const createChannel = (groupId: number, channelData: ChannelCreateRequest) => {
    return apiClient.post(`/groups/${groupId}/channels`, channelData);
};