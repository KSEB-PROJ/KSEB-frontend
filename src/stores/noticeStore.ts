import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import toast from 'react-hot-toast';

import type { Notice, NoticeCreateRequest, NoticeUpdateRequest } from '../types';
import { getNotices, createNotice as createNoticeApi, updateNotice as updateNoticeApi, deleteNotice as deleteNoticeApi, promoteMessageToNotice as promoteApi } from '../api/notice';

interface NoticeState {
    notices: Notice[];
    isLoading: boolean;
    fetchNotices: (groupId: number) => Promise<void>;
    createNotice: (groupId: number, data: NoticeCreateRequest) => Promise<boolean>;
    updateNotice: (groupId: number, noticeId: number, data: NoticeUpdateRequest) => Promise<boolean>;
    deleteNotice: (groupId: number, noticeId: number) => Promise<boolean>;
    promoteToNotice: (channelId: number, messageId: number) => Promise<void>;
    reset: () => void;
}

export const useNoticeStore = create<NoticeState>()(
    devtools(
        (set, get) => ({
            notices: [],
            isLoading: false,

            fetchNotices: async (groupId) => {
                set({ isLoading: true });
                try {
                    const response = await getNotices(groupId);
                    set({ notices: response.data, isLoading: false });
                } catch {
                    toast.error('공지를 불러오는데 실패했습니다.');
                    set({ isLoading: false });
                }
            },

            createNotice: async (groupId, data) => {
                try {
                    await createNoticeApi(groupId, data);
                    toast.success('공지를 성공적으로 등록했습니다.');
                    await get().fetchNotices(groupId); // 목록 새로고침
                    return true;
                } catch {
                    toast.error('공지 등록에 실패했습니다.');
                    return false;
                }
            },

            updateNotice: async (groupId, noticeId, data) => {
                try {
                    await updateNoticeApi(groupId, noticeId, data);
                    toast.success('공지가 수정되었습니다.');
                    await get().fetchNotices(groupId); // 목록 새로고침
                    return true;
                } catch {
                    toast.error('공지 수정에 실패했습니다.');
                    return false;
                }
            },

            deleteNotice: async (groupId, noticeId) => {
                try {
                    await deleteNoticeApi(groupId, noticeId);
                    toast.success('공지가 삭제되었습니다.');
                    // 로컬 상태에서 즉시 제거
                    set(state => ({
                        notices: state.notices.filter(n => n.id !== noticeId)
                    }));
                    return true;
                } catch {
                    toast.error('공지 삭제에 실패했습니다.');
                    return false;
                }
            },
            
            promoteToNotice: async (channelId, messageId) => {
                try {
                    await promoteApi(channelId, messageId);
                    toast.success('메시지를 공지 채널에 등록했습니다.');
                    // 공지 채널로 이동했을 때 목록이 어차피 다시 로드되므로, 여기서는 별도 액션 없음.
                } catch {
                    toast.error('공지 등록에 실패했습니다.');
                }
            },

            reset: () => {
                set({ notices: [], isLoading: false });
            }
        }),
        { name: 'NoticeStore' }
    )
);
