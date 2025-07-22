/**
 * @typedef EventParticipant
 * @description 이벤트 참여자의 정보를 담는 타입
 */
export interface EventParticipant {
    userId: number;
    userName: string;
    status: 'ACCEPTED' | 'DECLINED' | 'TENTATIVE';
}

/**
 * @typedef EventTask
 * @description 이벤트에 종속된 '할 일'의 타입
 */
export interface EventTask {
    id: number;
    eventId: string;
    title: string;
    status: 'TODO' | 'DOING' | 'DONE';
    dueDate: string | null;
}

/**
 * @typedef ScheduleEvent
 * @description 프론트엔드 캘린더에서 사용하는 이벤트 객체 타입
 */
export interface ScheduleEvent {
    id: string;
    title: string;
    start: string;
    end?: string;
    allDay: boolean;
    location?: string;
    ownerType: 'USER' | 'GROUP';
    ownerId: number;
    groupName?: string;
    color?: string;
    rrule?: string;
    description?: string;
    tasks?: EventTask[];
    participants?: EventParticipant[];
    isEditable?: boolean; // 수정/삭제 가능 여부
    createdBy?: number;   // 생성자 ID
}


/**
 * @typedef BackendEventResponse
 * @description 백엔드 /api/events 응답 DTO 형식
 */
export interface BackendEventResponse {
    eventId: number;
    title: string;
    description: string;
    location: string;
    startDatetime: string;
    endDatetime: string;
    allDay: boolean;
    rrule: string;
    ownerType: 'USER' | 'GROUP';
    ownerId: number;
    themeColor: string;
    participants: EventParticipant[];
    tasks: EventTaskResponse[]; // [추가] tasks 필드
    createdBy?: number; // createdBy 필드가 백엔드에 있다고 가정
}


/**
 * @description 백엔드 API DTO를 모방한 요청 타입들
 */
export interface UserEventCreateRequest {
    title: string;
    description?: string;
    location?: string;
    startDatetime: string;
    endDatetime: string;
    allDay: boolean;
    rrule?: string;
    themeColor?: string;
}

export type GroupEventCreateRequest = UserEventCreateRequest;


export interface EventUpdateRequest extends Partial<UserEventCreateRequest> {
    tasks?: EventTask[];
}


/**
 * @typedef Course
 * @description 대학 시간표의 강의 정보 타입
 */
export interface Course {
    id: number;
    course_code: string;
    course_name: string;
    professor: string;
    semester: string;
    day_of_week: 'MO' | 'TU' | 'WE' | 'TH' | 'FR' | 'SA' | 'SU';
    start_time: string;
    end_time: string;
    location: string;
    color?: string;
    rrule?: string;
}

/**
 * @description 할 일(Task) 생성을 위한 요청 타입
 */
export interface EventTaskCreateRequest {
    title: string;
    assigneeId?: number;
    statusId: number; // 1: TODO, 2: DOING, 3: DONE
    dueDatetime?: string | null;
}

/**
 * @description 일정 생성 API의 응답 타입
 */
export interface EventCreateResult {
    eventId: number;
    hasOverlap: boolean;
}

/**
 * @description 할 일(Task) 수정을 위한 요청 타입
 */
export interface UpdateTaskRequest {
    title?: string;
    assigneeId?: number;
    statusId?: number;
    dueDatetime?: string | null;
}

/**
 * @description 할 일(Task) API 응답 타입
 */
export interface EventTaskResponse {
    id: number;
    title: string;
    assigneeId: number;
    assigneeName: string;
    statusId: number;
    statusCode: string;
    statusName: string;
    dueDatetime: string;
}