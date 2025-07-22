import axios from 'axios';
import type {
    ScheduleEvent,
    UserEventCreateRequest,
    GroupEventCreateRequest,
    EventUpdateRequest,
    BackendEventResponse,
    GroupListDto,
    EventTaskCreateRequest,
    EventCreateResult,
    EventTaskResponse,
    EventTask
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

    // [수정] 백엔드 tasks를 프론트엔드 EventTask 형식으로 변환
    const tasks: EventTask[] = event.tasks.map(task => ({
        id: task.id,
        eventId: String(event.eventId),
        title: task.title,
        status: task.statusCode as 'TODO' | 'DOING' | 'DONE',
        dueDate: task.dueDatetime,
    }));

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
        tasks: tasks,
        isEditable: true,
        createdBy: event.createdBy,
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
    return apiClient.post<EventCreateResult>('/users/me/events', data);
};

// 그룹 이벤트 생성
export const createGroupEvent = (groupId: number, data: GroupEventCreateRequest) => {
    return apiClient.post<EventCreateResult>(`/groups/${groupId}/events`, data);
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

/**
 * 특정 이벤트에 할 일을 추가하는 API
 * @param eventId - 할 일을 추가할 이벤트의 ID
 * @param taskData - 생성할 할 일 데이터
 */
export const createTaskForEvent = (eventId: number, taskData: EventTaskCreateRequest) => {
    return apiClient.post<EventTaskResponse>(`/events/${eventId}/tasks`, taskData);
};