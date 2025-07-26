/**
 * @description 사용자가 속한 그룹 목록과 현재 선택된 그룹 정보를 관리하는 Zustand 스토어.
 * - 그룹 목록 조회 API 호출 및 상태 저장
 * - 사용자가 사이드바에서 선택한 그룹 상태 관리
 * - 그룹 생성/참여/삭제 등 변경이 발생했을 때 목록을 다시 불러오는 기능 제공
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { getMyGroups } from '../api/groups';
import type { Group, GroupListDto } from '../types/group';
import toast from 'react-hot-toast';

// GroupState: 스토어의 상태 및 액션 타입 정의
interface GroupState {
    groups: Group[];
    selectedGroup: Group | null;
    isLoading: boolean;
    fetchGroups: () => Promise<void>; // 그룹 목록을 API를 통해 가져오는 액션
    setSelectedGroup: (group: Group | null) => void; // 현재 선택된 그룹을 변경하는 액션
    reset: () => void; // 로그아웃 시 상태를 초기화하는 액션
}

export const useGroupStore = create<GroupState>()(
    devtools(
        (set, get) => ({
            // 초기 상태
            groups: [],
            selectedGroup: null,
            isLoading: true,

            /**
             * 사용자가 속한 그룹 목록을 서버에서 가져와 상태를 업데이트.
             */
            fetchGroups: async () => {
                set({ isLoading: true });
                try {
                    const response = await getMyGroups();
                    const formattedGroups: Group[] = response.data.map((dto: GroupListDto) => ({
                        id: dto.id,
                        name: dto.name,
                        code: dto.code,
                        themeColor: dto.themeColor || '132, 0, 255',
                        color: 'purple', // 이 부분은 필요시 로직 추가
                        colorValue: dto.themeColor || '132, 0, 255',
                        initials: dto.name.charAt(0).toUpperCase(),
                        members: [], // 상세 정보는 필요 시 별도 조회
                        memberCount: 0,
                    }));

                    set({ groups: formattedGroups });

                    // 현재 선택된 그룹이 유효한지 확인하고, 아니면 첫 번째 그룹으로 설정
                    const currentSelected = get().selectedGroup;
                    const isCurrentGroupValid = formattedGroups.some(g => g.id === currentSelected?.id);

                    if (!isCurrentGroupValid) {
                        const newSelectedGroup = formattedGroups.length > 0 ? formattedGroups[0] : null;
                        set({ selectedGroup: newSelectedGroup });
                        // CSS 변수 업데이트
                        document.documentElement.style.setProperty('--group-color', newSelectedGroup?.colorValue || '132, 0, 255');
                    }
                } catch (err) {
                    toast.error("그룹 목록을 불러오는 데 실패했습니다.");
                    // err 변수를 사용하여 에러 로그를 남김.
                    console.error("그룹 목록 조회 실패:", err);
                } finally {
                    set({ isLoading: false });
                }
            },

            /**
             * 사용자가 선택한 그룹을 상태에 반영하고, CSS 변수를 업데이트.
             * @param group - 사용자가 선택한 그룹 객체
             */
            setSelectedGroup: (group) => {
                set({ selectedGroup: group });
                document.documentElement.style.setProperty('--group-color', group?.colorValue || '132, 0, 255');
            },

            /**
             * 로그아웃 시 스토어의 상태를 초기값으로 되돌림.
             */
            reset: () => {
                set({
                    groups: [],
                    selectedGroup: null,
                    isLoading: true,
                });
            },
        }),
        { name: "GroupStore" } // Redux DevTools에 표시될 스토어 이름
    )
);