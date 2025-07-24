import apiClient from './index';
import type { Group, GroupListDto } from '../types';

/**
 * 내가 속한 모든 그룹 목록을 가져오는 API
 * @returns Promise<Group[]>
 */
export const getMyGroups = () => {
    return apiClient.get<GroupListDto[]>('/groups');
};

/**
 * 특정 그룹의 상세 정보를 가져오는 API
 * @param groupId - 조회할 그룹의 ID
 * @returns Promise<Group>
 */
export const getGroupDetail = (groupId: number) => {
    return apiClient.get<Group>(`/groups/${groupId}`);
};

/**
 * 새로운 그룹을 생성하는 API
 * @param groupData - 생성할 그룹의 이름 { name: string }
 * @returns Promise
 */
export const createGroup = (groupData: { name: string; themeColor: string; }) => {
    return apiClient.post('/groups', groupData);
};

/**
 * 초대 코드로 그룹에 참여하는 API
 * @param inviteCode - 참여할 그룹의 초대 코드
 * @returns Promise
 */
export const joinGroup = (inviteCode: string) => {
    return apiClient.post('/groups/join', { inviteCode });
};