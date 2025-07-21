import axios from 'axios';
import type { Notice, NoticeCreateRequest, NoticeUpdateRequest, NoticePinRequest, NoticePromoteRequest } from '../types/notice';

/**
 * API 클라이언트 설정
 */
const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    withCredentials: true,
});

/**
 * 특정 그룹의 모든 공지 목록을 가져오는 API
 * @param groupId - 조회할 그룹의 ID
 * @returns Promise<Notice[]>
 */
export const getNotices = (groupId: number) => {
    return apiClient.get<Notice[]>(`/groups/${groupId}/notices`);
};

/**
 * 새로운 공지를 생성하는 API
 * @param groupId - 공지를 생성할 그룹의 ID
 * @param noticeData - 생성할 공지 데이터 { channelId, content, pinnedUntil }
 * @returns Promise<Notice>
 */
export const createNotice = (groupId: number, noticeData: NoticeCreateRequest) => {
    return apiClient.post<Notice>(`/groups/${groupId}/notices`, noticeData);
};

/**
 * 공지를 수정하는 API
 * @param groupId - 그룹 ID
 * @param noticeId - 수정할 공지의 ID
 * @param noticeData - 수정할 내용 { content, pinnedUntil }
 * @returns Promise<Notice>
 */
export const updateNotice = (groupId: number, noticeId: number, noticeData: NoticeUpdateRequest) => {
    return apiClient.patch<Notice>(`/groups/${groupId}/notices/${noticeId}`, noticeData);
};

/**
 * 공지를 삭제하는 API
 * @param groupId - 그룹 ID
 * @param noticeId - 삭제할 공지의 ID
 * @returns Promise<void>
 */
export const deleteNotice = (groupId: number, noticeId: number) => {
    return apiClient.delete<void>(`/groups/${groupId}/notices/${noticeId}`);
};

/**
 * 공지 고정/해제 API
 * @param groupId - 그룹 ID
 * @param noticeId - 고정할 공지의 ID
 * @param pinData - 고정 만료 시간 { pinnedUntil } (null이면 고정 해제)
 * @returns Promise<Notice>
 */
export const pinNotice = (groupId: number, noticeId: number, pinData: NoticePinRequest) => {
    // 백엔드에 별도의 pinNotice 엔드포인트가 없으므로, updateNotice를 재사용합니다.
    // pinnedUntil 값만 담아서 보냅니다.
    const updateData: NoticeUpdateRequest = { pinnedUntil: pinData.pinnedUntil };
    return apiClient.patch<Notice>(`/groups/${groupId}/notices/${noticeId}`, updateData);
};

/**
 * 채팅 메시지를 공지로 승격시키는 API
 * @param _groupId - 그룹 ID
 * @param channelId - 채널 ID
 * @param messageId - 공지로 만들 메시지 ID
 * @param promoteData - 고정 만료 시간 { pinnedUntil }
 * @returns Promise<Notice>
 */
export const promoteMessageToNotice = (_groupId: number, channelId: number, messageId: number, promoteData: NoticePromoteRequest) => {
    // groupId는 URL에 포함되지 않지만, 일관성을 위해 파라미터로 받습니다.
    return apiClient.post<Notice>(`/channels/${channelId}/messages/${messageId}/promote-notice`, promoteData);
};