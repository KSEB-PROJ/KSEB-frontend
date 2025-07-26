/**
 * @description 현재 선택된 그룹의 채널 목록을 관리하는 Zustand 스토어.
 * - groupStore의 selectedGroup 상태 변화를 구독하여, 그룹이 변경되면 자동으로 채널 목록을 새로고침 함.
 * - 채널 생성/수정/삭제 API 호출 및 상태 업데이트 기능.
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { getChannelsByGroup, createChannel } from '../api/channels';
import type { Channel, ChannelListDto, ChannelCreateRequest } from '../types';
import toast from 'react-hot-toast';
import { useGroupStore } from './groupStore';

// ChannelState: 스토어의 상태 및 액션 타입 정의
interface ChannelState {
    channels: Channel[];
    isLoading: boolean;
    fetchChannels: (groupId: number) => Promise<void>;
    addChannel: (groupId: number, channelData: ChannelCreateRequest) => Promise<void>;
    reset: () => void; // 로그아웃 시 상태 초기화
}

// 채널 타입 코드에 따라 이름을 반환하는 헬퍼 함수
const getChannelTypeNameByCode = (code: string) => {
    switch (code.toUpperCase()) {
        case 'NOTICE':
            return '공지사항';
        case 'CALENDAR':
            return '캘린더';
        case 'CHAT':
            return '채팅';
        default:
            return '알 수 없음';
    }
};

export const useChannelStore = create<ChannelState>()(
    devtools(
        (set, get) => ({
            // 초기 상태
            channels: [],
            isLoading: false,

            /**
             * 특정 그룹 ID에 해당하는 채널 목록을 서버에서 가져와 업데이트.
             * @param groupId - 채널 목록을 조회할 그룹의 ID
             */
            fetchChannels: async (groupId: number) => {
                set({ isLoading: true });
                try {
                    const response = await getChannelsByGroup(groupId);
                    const formattedChannels: Channel[] = response.data.map((dto: ChannelListDto) => ({
                        ...dto,
                        channelTypeName: getChannelTypeNameByCode(dto.channelTypeCode),
                        description: `이곳은 ${dto.name} 채널입니다.`
                    }));
                    set({ channels: formattedChannels });
                } catch (err) {
                    toast.error("채널 목록을 불러오는 데 실패했습니다.");
                    console.error("채널 목록 조회 실패:", err);
                    set({ channels: [] }); // 실패 시 빈 배열로 초기화
                } finally {
                    set({ isLoading: false });
                }
            },

            /**
             * 새로운 채널을 생성하고, 성공 시 전체 채널 목록을 다시 불러옴.
             * @param groupId - 채널을 생성할 그룹의 ID
             * @param channelData - 생성할 채널의 정보
             */
            addChannel: async (groupId: number, channelData: ChannelCreateRequest) => {
                await createChannel(groupId, channelData);
                await get().fetchChannels(groupId); // 생성 후 목록 새로고침
            },

            /**
             * 로그아웃 시 스토어의 상태를 초기값으로 되돌림.
             */
            reset: () => {
                set({
                    channels: [],
                    isLoading: false,
                });
            },
        }),
        { name: "ChannelStore" }
    )
);

/**
 * groupStore의 상태 변화 구독.
 * selectedGroup이 변경되면, channelStore의 fetchChannels 액션을 호출하여
 * 새로운 그룹의 채널 목록을 자동으로 불러옴.
 */
useGroupStore.subscribe(
    (state, prevState) => {
        const newGroupId = state.selectedGroup?.id;
        const oldGroupId = prevState.selectedGroup?.id;

        if (newGroupId && newGroupId !== oldGroupId) {
            useChannelStore.getState().fetchChannels(newGroupId);
        } else if (!newGroupId && oldGroupId) {
            // 그룹 선택이 해제되면 채널 목록을 비움.
            useChannelStore.getState().reset();
        }
    }
);