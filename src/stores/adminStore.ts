import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import toast from 'react-hot-toast';
import { 
    getDashboardData, getUsers, updateUserRole, deleteUser, getGroups, deleteGroup, getGroupDetails, getLogs, 
    getDailyRegistrations, getHourlyActivity, getContentTypeDistribution 
} from '../api/admin';
import type { LogFilterParams } from '../api/admin';
import type { 
    DashboardData, PagedAdminUserResponse, UserAdmin, GroupAdmin, PagedAdminGroupResponse, 
    GroupDetailAdminResponse, LogAdmin, PagedAdminLogResponse 
} from '../types/admin';

// 스토어에서 사용할 추가 타입 정의
export type ContentTypeDistribution = {
    groupCount: number;
    channelCount: number;
    noticeCount: number;
    eventCount: number;
};

interface AdminState {
    // --- 상태(State) ---
    dashboardData: DashboardData | null;
    users: UserAdmin[];
    userPagination: Omit<PagedAdminUserResponse, 'content'> | null;
    groups: GroupAdmin[];
    groupPagination: Omit<PagedAdminGroupResponse, 'content'> | null;
    selectedGroupDetails: GroupDetailAdminResponse | null; // 그룹 상세 정보
    isLoadingDetails: boolean; // 상세 정보 로딩 상태
    logs: LogAdmin[];
    logPagination: Omit<PagedAdminLogResponse, 'content'> | null;
    dailyRegistrations: { date: string; count: number }[];
    hourlyActivity: { hour: number; count: number }[];
    contentTypeDistribution: ContentTypeDistribution | null;
    isLoading: boolean;
    error: string | null;

    // --- 액션(Actions) ---
    fetchDashboardData: () => Promise<void>;
    fetchUsers: (page: number, size: number) => Promise<void>;
    updateUserRoleAction: (userId: number, role: UserAdmin['role']) => Promise<void>;
    deleteUserAction: (userId: number) => Promise<void>;
    fetchGroups: (page: number, size: number) => Promise<void>;
    deleteGroupAction: (groupId: number) => Promise<void>;
    fetchGroupDetails: (groupId: number) => Promise<void>; // 그룹 상세 정보 가져오기
    clearGroupDetails: () => void; // 그룹 상세 정보 초기화
    fetchLogs: (params: LogFilterParams) => Promise<void>;
    fetchStats: () => Promise<void>;
}

export const useAdminStore = create<AdminState>()(
    devtools(
        (set, get) => ({
            // --- 상태 초기값 ---
            dashboardData: null,
            users: [],
            userPagination: null,
            groups: [],
            groupPagination: null,
            selectedGroupDetails: null,
            isLoadingDetails: false,
            logs: [],
            logPagination: null,
            dailyRegistrations: [],
            hourlyActivity: [],
            contentTypeDistribution: null,
            isLoading: false,
            error: null,

            // --- 대시보드 액션 구현 ---
            fetchDashboardData: async () => {
                set({ isLoading: true, error: null });
                try {
                    const data = await getDashboardData();
                    set({ dashboardData: data, isLoading: false });
                } catch (error) {
                    console.error('Failed to fetch dashboard data:', error);
                    set({ isLoading: false, error: '대시보드 데이터를 불러오는 데 실패했습니다.' });
                }
            },

            // --- 사용자 관리 액션 구현 ---
            fetchUsers: async (page, size) => {
                set({ isLoading: true, error: null });
                try {
                    const response = await getUsers(page, size);
                    const { content, ...pagination } = response;
                    set({ users: content, userPagination: pagination, isLoading: false });
                } catch (error) {
                    console.error('Failed to fetch users:', error);
                    set({ isLoading: false, error: '사용자 목록을 불러오는 데 실패했습니다.' });
                }
            },
            updateUserRoleAction: async (userId, role) => {
                try {
                    await toast.promise(
                        updateUserRole(userId, role),
                        {
                            loading: '사용자 역할 변경 중...',
                            success: '역할 변경 완료.',
                            error: '역할 변경 실패.',
                        }
                    );
                    const { userPagination } = get();
                    if (userPagination) {
                        get().fetchUsers(userPagination.number, userPagination.size);
                    }
                } catch (error) {
                    console.error('Failed to update user role:', error);
                }
            },
            deleteUserAction: async (userId) => {
                try {
                    await toast.promise(
                        deleteUser(userId),
                        {
                            loading: '사용자 삭제 중...',
                            success: '사용자 삭제 완료.',
                            error: '사용자 삭제 실패.',
                        }
                    );
                    const { userPagination } = get();
                    if (userPagination) {
                        get().fetchUsers(userPagination.number, userPagination.size);
                    }
                } catch (error) {
                    console.error('Failed to delete user:', error);
                }
            },

            // --- 그룹 관리 액션 구현 ---
            fetchGroups: async (page, size) => {
                set({ isLoading: true, error: null });
                try {
                    const response = await getGroups(page, size);
                    const { content, ...pagination } = response;
                    set({ groups: content, groupPagination: pagination, isLoading: false });
                } catch (error) {
                    console.error('Failed to fetch groups:', error);
                    set({ isLoading: false, error: '그룹 목록을 불러오는 데 실패했습니다.' });
                }
            },
            deleteGroupAction: async (groupId) => {
                try {
                    await toast.promise(
                        deleteGroup(groupId),
                        {
                            loading: '그룹 삭제 중...',
                            success: '그룹 삭제 완료.',
                            error: '그룹 삭제 실패.',
                        }
                    );
                    const { groupPagination } = get();
                    if (groupPagination) {
                        get().fetchGroups(groupPagination.number, groupPagination.size);
                    }
                } catch (error) {
                    console.error('Failed to delete group:', error);
                }
            },
            fetchGroupDetails: async (groupId) => {
                set({ isLoadingDetails: true, error: null });
                try {
                    const details = await getGroupDetails(groupId);
                    set({ selectedGroupDetails: details, isLoadingDetails: false });
                } catch (error) {
                    console.error('Failed to fetch group details:', error);
                    set({ isLoadingDetails: false, error: '그룹 상세 정보를 불러오는 데 실패했습니다.' });
                    toast.error('그룹 상세 정보를 불러오는 데 실패했습니다.');
                }
            },
            clearGroupDetails: () => {
                set({ selectedGroupDetails: null });
            },

            // --- 활동 로그 액션 구현 ---
            fetchLogs: async (params) => {
                set({ isLoading: true, error: null });
                try {
                    const response = await getLogs(params);
                    const { content, ...pagination } = response;
                    set({ logs: content, logPagination: pagination, isLoading: false });
                } catch (error) {
                    console.error('Failed to fetch logs:', error);
                    set({ isLoading: false, error: '활동 로그를 불러오는 데 실패했습니다.' });
                }
            },

            // --- 통계 액션 구현 ---
            fetchStats: async () => {
                set({ isLoading: true });
                try {
                    const [daily, hourly, distribution] = await Promise.all([
                        getDailyRegistrations(),
                        getHourlyActivity(),
                        getContentTypeDistribution(),
                    ]);
                    set({
                        dailyRegistrations: daily,
                        hourlyActivity: hourly,
                        contentTypeDistribution: distribution,
                        isLoading: false,
                    });
                } catch (error) {
                    console.error('Failed to fetch stats:', error);
                    set({ isLoading: false, error: '통계 데이터를 불러오는 데 실패했습니다.' });
                }
            },
        }),
        { name: 'admin-storage' }
    )
);