/**
 * @description 특정 그룹의 공지사항을 관리하는 Zustand 스토어.
 * - 공지사항 목록 조회, 생성, 수정, 삭제 API 연동
 * - NoticePage에서 사용될 상태와 로직을 중앙에서 관리.
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import toast from 'react-hot-toast';
import type { Notice, NoticeCreateRequest, NoticeUpdateRequest } from '../types';
import { getNotices, createNotice, updateNotice, deleteNotice, promoteMessageToNotice } from '../api/notice';

interface NoticeState {
    notices: Notice[];
    isLoading: boolean;
    fetchNotices: (groupId: number) => Promise<void>;
    createNotice: (groupId: number, noticeData: NoticeCreateRequest) => Promise<void>;
    updateNotice: (groupId: number, noticeId: number, noticeData: NoticeUpdateRequest) => Promise<void>;
    deleteNotice: (groupId: number, noticeId: number) => Promise<void>;
    promoteToNotice: (groupId: number, channelId: number, messageId: number) => Promise<void>;
    reset: () => void;
}

export const useNoticeStore = create<NoticeState>()(
    devtools(
        (set, get) => ({
            notices: [],
            isLoading: true,

            /**
             * 특정 그룹의 공지 목록을 불러옴.
             */
            fetchNotices: async (groupId: number) => {
                set({ isLoading: true });
                try {
                    const response = await getNotices(groupId);
                    set({ notices: response.data });
                } catch (error) {
                    toast.error("공지 목록을 불러오는 데 실패했습니다.");
                    console.error("공지 조회 실패:", error);
                } finally {
                    set({ isLoading: false });
                }
            },

            /**
             * 새로운 공지 생성.
             */
            createNotice: async (groupId: number, noticeData: NoticeCreateRequest) => {
                await toast.promise(createNotice(groupId, noticeData), {
                    loading: '공지 생성 중...',
                    success: '공지가 등록되었습니다.',
                    error: '공지 등록에 실패했습니다.',
                });
                await get().fetchNotices(groupId); // 데이터 새로고침
            },

            /**
             * 기존 공지 수정.
             */
            updateNotice: async (groupId: number, noticeId: number, noticeData: NoticeUpdateRequest) => {
                await toast.promise(updateNotice(groupId, noticeId, noticeData), {
                    loading: '수정 중...',
                    success: '수정되었습니다.',
                    error: '수정에 실패했습니다.',
                });
                await get().fetchNotices(groupId);
            },

            /**
             * 공지 삭제.
             */
            deleteNotice: async (groupId: number, noticeId: number) => {
                await toast.promise(deleteNotice(groupId, noticeId), {
                    loading: '삭제 중...',
                    success: '삭제되었습니다.',
                    error: '삭제에 실패했습니다.',
                });
                set(state => ({
                    notices: state.notices.filter(n => n.id !== noticeId)
                }));
            },

            /**
             * 채팅 메시지를 공지로 등록.
             */
            promoteToNotice: async (groupId: number, channelId: number, messageId: number) => {
                await toast.promise(promoteMessageToNotice(groupId, channelId, messageId, {}), {
                    loading: '공지로 등록 중...',
                    success: '공지로 등록되었습니다.',
                    error: '공지 등록에 실패했습니다.',
                });
                await get().fetchNotices(groupId);
            },

            /**
             * 로그아웃 시 스토어 상태를 초기화.
             */
            reset: () => set({ notices: [], isLoading: true }),
        }),
        { name: "NoticeStore" }
    )
);