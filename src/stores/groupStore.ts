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
    fetchGroupDetailAndUpdate: (groupId: number) => Promise<void>;
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
                        code: dto.code || '',
                        themeColor: dto.themeColor || '132, 0, 255',
                        color: 'purple',
                        colorValue: dto.themeColor || '132, 0, 255',
                        initials: dto.name.charAt(0).toUpperCase(),
                        members: [],
                        memberCount: 0,
                    }));

                    set({ groups: formattedGroups });

                    // --- 페이지 새로고침 시 현재 URL에서 그룹을 선택하는 로직 ---
                    const path = window.location.pathname;
                    const match = path.match(/\/app\/groups\/(\d+)/);
                    const groupIdFromUrl = match ? parseInt(match[1], 10) : null;
                    
                    let groupToSelect: Group | null = null;

                    if (groupIdFromUrl) {
                        groupToSelect = formattedGroups.find(g => g.id === groupIdFromUrl) || null;
                    }
                    
                    // URL에 유효한 그룹 ID가 없으면, 첫 번째 그룹을 기본값으로 설정
                    if (!groupToSelect && formattedGroups.length > 0) {
                        groupToSelect = formattedGroups[0];
                    }

                    // 최종적으로 선택된 그룹으로 상태 업데이트
                    if (groupToSelect) {
                        get().setSelectedGroup(groupToSelect);
                    }

                } catch (err) {
                    toast.error("그룹 목록을 불러오는 데 실패했습니다.");
                    console.error("그룹 목록 조회 실패:", err);
                } finally {
                    set({ isLoading: false });
                }
            },

            setSelectedGroup: (group) => {
                if (!group) {
                    set({ selectedGroup: null });
                    return;
                }

                const currentGroup = get().selectedGroup;
                // 이미 선택된 그룹이고 멤버 정보가 있다면 다시 호출하지 않음
                if (currentGroup?.id === group.id && currentGroup.members && currentGroup.members.length > 0) {
                    return;
                }

                set({ selectedGroup: group });
                document.documentElement.style.setProperty('--group-color', group.colorValue || '132, 0, 255');

                // 상세 정보(멤버 리스트 등)는 별도로 가져옴
                get().fetchGroupDetailAndUpdate(group.id);
            },

            fetchGroupDetailAndUpdate: async (groupId: number) => {
                // 스토어에서 최신 그룹 정보를 다시 조회
                const originalGroupInStore = get().groups.find(g => g.id === groupId);

                // API 호출 방지 로직: 그룹이 존재하고, 멤버 정보가 이미 로드되었다면 실행하지 않음
                if (originalGroupInStore && originalGroupInStore.members && originalGroupInStore.members.length > 0) {
                    // 만약 현재 선택된 그룹의 멤버가 없는 상태라면, 스토어에 이미 있는 정보로 업데이트
                    const selectedGroup = get().selectedGroup;
                    if(selectedGroup && selectedGroup.id === groupId && selectedGroup.members.length === 0) {
                        set({ selectedGroup: originalGroupInStore });
                    }
                    return;
                }

                try {
                    const detailResponse = await getGroupDetail(groupId);
                    const detailedGroupData = detailResponse.data;

                    set(state => {
                        // groups 배열 업데이트
                        const newGroups = state.groups.map(g =>
                            g.id === groupId ? { ...g, ...detailedGroupData } : g
                        );

                        // selectedGroup 업데이트
                        const newSelectedGroup = state.selectedGroup?.id === groupId
                            ? { ...state.selectedGroup, ...detailedGroupData }
                            : state.selectedGroup;

                        return {
                            groups: newGroups,
                            selectedGroup: newSelectedGroup
                        };
                    });
                } catch (error) {
                    console.error("그룹 상세 정보 조회 실패:", error);
                    toast.error("그룹 멤버 정보를 가져오는 데 실패했습니다.");
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