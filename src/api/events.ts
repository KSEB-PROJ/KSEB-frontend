import axios from 'axios';
import type {
    ScheduleEvent,
    UserEventCreateRequest,
    GroupEventCreateRequest,
    EventUpdateRequest,
    BackendEventResponse,
    GroupListDto,
} from '../types';

const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    withCredentials: true,
});

/**
 * 백엔드 EventResponse를 프론트엔드 ScheduleEvent로 변환
 * @param event - 백엔드로부터 받은 이벤트 객체
 * @param groups - 사용자가 속한 그룹 목록 (groupName을 찾기 위함)
 * @returns
 */
export const transformToScheduleEvent = (event: BackendEventResponse, groups: GroupListDto[] = []): ScheduleEvent => {
    let groupName: string | undefined;
    if (event.ownerType === 'GROUP') {
        const group = groups.find(g => g.id === event.ownerId);
        groupName = group?.name;
    }

    return {
        id: String(event.eventId),
        title: event.title,
        start: event.startDatetime,
        end: event.endDatetime,
        allDay: event.allDay,
        location: event.location,
        ownerType: event.ownerType,
        ownerId: event.ownerId,
        groupName: groupName,
        color: event.themeColor,
        rrule: event.rrule,
        description: event.description,
        participants: event.participants,
        // isEditable과 createdBy는 API 응답에 없으므로, 필요 시 호출하는 쪽에서 채워야 함
        // 여기서는 기본값으로 설정
        isEditable: true,
        createdBy: undefined,
    };
};


// 개인 + 속한 그룹의 모든 이벤트 조회
export const getMyEvents = async () => {
    const response = await apiClient.get<BackendEventResponse[]>('/users/me/events');
    return response.data;
};

// 특정 그룹의 이벤트 조회
export const getGroupEvents = async (groupId: number) => {
    const response = await apiClient.get<BackendEventResponse[]>(`/groups/${groupId}/events`);
    return response.data;
};


// 개인 이벤트 생성
export const createPersonalEvent = (data: UserEventCreateRequest) => {
    return apiClient.post('/users/me/events', data);
};

// 그룹 이벤트 생성
export const createGroupEvent = (groupId: number, data: GroupEventCreateRequest) => {
    return apiClient.post(`/groups/${groupId}/events`, data);
};

// 개인 이벤트 수정
export const updatePersonalEvent = (eventId: number, data: EventUpdateRequest) => {
    return apiClient.patch(`/users/me/events/${eventId}`, data);
};

// 그룹 이벤트 수정
export const updateGroupEvent = (groupId: number, eventId: number, data: EventUpdateRequest) => {
    return apiClient.patch(`/groups/${groupId}/events/${eventId}`, data);
};

// 개인 이벤트 삭제
export const deletePersonalEvent = (eventId: number) => {
    return apiClient.delete(`/users/me/events/${eventId}`);
};

// 그룹 이벤트 삭제
export const deleteGroupEvent = (groupId: number, eventId: number) => {
    return apiClient.delete(`/groups/${groupId}/events/${eventId}`);
};