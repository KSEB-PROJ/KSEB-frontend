/**
 * @description 사용자가 속한 그룹 목록과 현재 선택된 그룹 정보를 관리하는 Zustand 스토어.
 */
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { getMyGroups, getGroupDetail } from '../api/groups';
import type { Group, GroupListDto } from '../types/group';
import toast from 'react-hot-toast';

interface GroupState {
    groups: Group[];
    selectedGroup: Group | null;
    isLoading: boolean;
    fetchGroups: () => Promise<void>;
    setSelectedGroup: (group: Group | null) => void;
    fetchGroupDetailAndUpdate: (groupId: number) => Promise<void>; // 상세 정보 가져와 업데이트하는 액션
    reset: () => void;
}

export const useGroupStore = create<GroupState>()(
    devtools(
        (set, get) => ({
            groups: [],
            selectedGroup: null,
            isLoading: true,

            fetchGroups: async () => {
                set({ isLoading: true });
                try {
                    const response = await getMyGroups();
                    const formattedGroups: Group[] = response.data.map((dto: GroupListDto) => ({
                        id: dto.id,
                        name: dto.name,
                        code: dto.code || '', // API 응답에 코드가 없을 수 있으므로 초기값은 빈 문자열로 설정
                        themeColor: dto.themeColor || '132, 0, 255',
                        color: 'purple',
                        colorValue: dto.themeColor || '132, 0, 255',
                        initials: dto.name.charAt(0).toUpperCase(),
                        members: [],
                        memberCount: 0,
                    }));

                    set({ groups: formattedGroups });

                    const currentSelected = get().selectedGroup;
                    const isCurrentGroupValid = formattedGroups.some(g => g.id === currentSelected?.id);

                    if (!isCurrentGroupValid && formattedGroups.length > 0) {
                        get().setSelectedGroup(formattedGroups[0]);
                    }
                } catch (err) {
                    toast.error("그룹 목록을 불러오는 데 실패했습니다.");
                    console.error("그룹 목록 조회 실패:", err);
                } finally {
                    set({ isLoading: false });
                }
            },

            // 그룹 선택: API 호출 없이 상태만 변경하여 UI 반응성을 높임
            setSelectedGroup: (group) => {
                set({ selectedGroup: group });
                if (group) {
                    document.documentElement.style.setProperty('--group-color', group.colorValue || '132, 0, 255');
                }
            },

            // 그룹 상세 정보(초대 코드 포함)를 가져와 상태를 업데이트하는 새 액션
            fetchGroupDetailAndUpdate: async (groupId: number) => {
                const originalGroup = get().groups.find(g => g.id === groupId);
                // 이미 코드가 있는 경우 다시 호출하지 않음
                if (originalGroup && originalGroup.code) {
                    return;
                }

                try {
                    const detailResponse = await getGroupDetail(groupId);
                    const detailedGroupData = detailResponse.data;

                    set(state => ({
                        groups: state.groups.map(g => 
                            g.id === groupId ? { ...g, ...detailedGroupData } : g
                        ),
                        selectedGroup: state.selectedGroup?.id === groupId 
                            ? { ...state.selectedGroup, ...detailedGroupData } 
                            : state.selectedGroup,
                    }));
                } catch (error) {
                    // 개별 실패는 조용히 처리하여 사용자 경험을 방해하지 않음
                    console.error("그룹 상세 정보 조회 실패:", error);
                }
            },

            reset: () => {
                set({
                    groups: [],
                    selectedGroup: null,
                    isLoading: true,
                });
            },
        }),
        { name: "GroupStore" }
    )
);