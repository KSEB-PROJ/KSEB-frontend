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
                
                // 상태를 업데이트하기 전에 현재 그룹과 같은지 확인하여 불필요한 API 호출 방지
                const currentGroup = get().selectedGroup;
                if (currentGroup?.id === group.id && currentGroup.code) {
                    return;
                }

                set({ selectedGroup: group });
                document.documentElement.style.setProperty('--group-color', group.colorValue || '132, 0, 255');
                
                // 상세 정보(초대 코드)는 별도로 가져옴
                get().fetchGroupDetailAndUpdate(group.id);
            },

            fetchGroupDetailAndUpdate: async (groupId: number) => {
                const originalGroup = get().groups.find(g => g.id === groupId);
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