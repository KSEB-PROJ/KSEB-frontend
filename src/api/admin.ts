import apiClient from './index';
import type { DashboardData, PagedAdminUserResponse, UserAdmin, PagedAdminGroupResponse, PagedAdminLogResponse } from '../types/admin';
import { format } from 'date-fns';

/**
 * 관리자 대시보드 데이터를 가져옵니다.
 */
export const getDashboardData = async (): Promise<DashboardData> => {
    const response = await apiClient.get('/admin/dashboard');
    return response.data;
};

/**
 * 사용자 목록을 페이지별로 가져옵니다.
 */
export const getUsers = async (page: number, size: number): Promise<PagedAdminUserResponse> => {
    const response = await apiClient.get('/admin/users', { params: { page, size } });
    return response.data;
};

/**
 * 사용자의 역할을 변경합니다.
 */
export const updateUserRole = async (userId: number, role: UserAdmin['role']): Promise<void> => {
    await apiClient.put(`/admin/users/${userId}/role`, null, { params: { role } });
};

/**
 * 사용자를 삭제합니다.
 */
export const deleteUser = async (userId: number): Promise<void> => {
    await apiClient.delete(`/admin/users/${userId}`);
};

/**
 * 그룹 목록을 페이지별로 가져옵니다.
 */
export const getGroups = async (page: number, size: number): Promise<PagedAdminGroupResponse> => {
    const response = await apiClient.get('/admin/groups', { params: { page, size } });
    return response.data;
}

/**
 * 그룹을 삭제합니다.
 */
export const deleteGroup = async (groupId: number): Promise<void> => {
    await apiClient.delete(`/admin/groups/${groupId}`);
}

/**
 * 관리자용 그룹 상세 정보를 가져옵니다.
 */
export const getGroupDetails = async (groupId: number): Promise<GroupDetailAdminResponse> => {
    const response = await apiClient.get(`/admin/groups/${groupId}`);
    return response.data;
}

export interface LogFilterParams {
    page: number;
    size: number;
    actorName?: string;
    actionTypes?: string[];
    startDate?: Date | null;
    endDate?: Date | null;
}

/**
 * 로그 목록을 필터 조건에 따라 가져옵니다.
 */
export const getLogs = async (params: LogFilterParams): Promise<PagedAdminLogResponse> => {
    const queryParams: Record<string, any> = {
        page: params.page,
        size: params.size,
    };

    if (params.actorName) queryParams.actorName = params.actorName;
    if (params.actionTypes && params.actionTypes.length > 0) queryParams.actionTypes = params.actionTypes.join(',');
    if (params.startDate) queryParams.startDate = format(params.startDate, 'yyyy-MM-dd');
    if (params.endDate) queryParams.endDate = format(params.endDate, 'yyyy-MM-dd');

    const response = await apiClient.get('/admin/logs', { params: queryParams });
    return response.data;
};

/**
 * 일자별 가입자 수 통계를 가져옵니다.
 */
export const getDailyRegistrations = async (days: number = 7) => {
    const response = await apiClient.get('/admin/stats/daily-registrations', { params: { days } });
    return response.data;
};

/**
 * 시간대별 활동량 통계를 가져옵니다.
 */
export const getHourlyActivity = async (hours: number = 24) => {
    const response = await apiClient.get('/admin/stats/hourly-activity', { params: { hours } });
    return response.data;
};

/**
 * 콘텐츠 생성 비율 통계를 가져옵니다.
 */
export const getContentTypeDistribution = async () => {
    const response = await apiClient.get('/admin/stats/content-distribution');
    return response.data;
};