import apiClient from './index';
import type { Notice, NoticeCreateRequest, NoticeUpdateRequest, NoticePinRequest, NoticePromoteRequest } from '../types/notice';

/**
 * 특정 그룹의 모든 공지 목록을 가져오는 API
 */
export const getNotices = (groupId: number) => {
    return apiClient.get<Notice[]>(`/groups/${groupId}/notices`);
};

/**
 * 새로운 공지를 생성하는 API
 */
export const createNotice = (groupId: number, noticeData: NoticeCreateRequest) => {
    return apiClient.post<Notice>(`/groups/${groupId}/notices`, noticeData);
};

/**
 * 공지를 수정하는 API
 */
export const updateNotice = (groupId: number, noticeId: number, noticeData: NoticeUpdateRequest) => {
    return apiClient.patch<Notice>(`/groups/${groupId}/notices/${noticeId}`, noticeData);
};

/**
 * 공지를 삭제하는 API
 */
export const deleteNotice = (groupId: number, noticeId: number) => {
    return apiClient.delete<void>(`/groups/${groupId}/notices/${noticeId}`);
};

/**
 * 채팅 메시지를 공지로 승격시키는 API
 */
export const promoteMessageToNotice = (channelId: number, messageId: number) => {
    // 이 API는 groupId가 필요 없고, pinnedUntil 같은 데이터도 보내지 않습니다.
    return apiClient.post<Notice>(`/channels/${channelId}/messages/${messageId}/promote-notice`, {});
};