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
    createNotice: (groupId: number, noticeData: NoticeCreateRequest) => Promise<boolean>;
    updateNotice: (groupId: number, noticeId: number, noticeData: NoticeUpdateRequest) => Promise<boolean>;
    deleteNotice: (groupId: number, noticeId: number) => Promise<boolean>;
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
                    set({ notices: response.data, isLoading: false });
                } catch (error) {
                    toast.error("공지 목록을 불러오는 데 실패했습니다.");
                    console.error("공지 조회 실패:", error);
                    set({ isLoading: false });
                }
            },

            /**
             * 새로운 공지 생성.
             */
            createNotice: async (groupId: number, noticeData: NoticeCreateRequest) => {
                let success = false;
                await toast.promise(
                    createNotice(groupId, noticeData),
                    {
                        loading: '공지 생성 중...',
                        success: () => {
                            success = true;
                            return '공지가 등록되었습니다.';
                        },
                        error: '공지 등록에 실패했습니다.',
                    }
                );
                if (success) {
                    await get().fetchNotices(groupId); // 생성 후에는 목록을 다시 불러옵니다.
                }
                return success;
            },

            /**
             * [수정됨] 기존 공지 수정.
             * API 성공 시, 전체 목록을 다시 fetch하는 대신 로컬 상태를 직접 업데이트하여 즉각적인 UI 반응을 제공합니다.
             */
            updateNotice: async (groupId, noticeId, noticeData) => {
                let success = false;
                await toast.promise(
                    updateNotice(groupId, noticeId, noticeData).then(response => {
                        set(state => {
                            // 완전히 새 배열로 할당!
                            const newNotices = state.notices.map(n => n.id === noticeId ? response.data : n);
                            return { notices: [...newNotices] };
                        });
                    }),
                    {
                        loading: '수정 중...',
                        success: () => {
                            success = true;
                            return '수정되었습니다.';
                        },
                        error: '수정에 실패했습니다.',
                    }
                );
                return success;
            },


            /**
             * 공지 삭제.
             */
            deleteNotice: async (groupId: number, noticeId: number) => {
                let success = false;
                await toast.promise(
                    deleteNotice(groupId, noticeId),
                    {
                        loading: '삭제 중...',
                        success: () => {
                            success = true;
                            return '삭제되었습니다.';
                        },
                        error: '삭제에 실패했습니다.',
                    }
                );
                if (success) {
                    set(state => ({
                        notices: state.notices.filter(n => n.id !== noticeId)
                    }));
                }
                return success;
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