
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
 * @typedef ScheduleEvent
 * @description 캘린더에 표시되는 기본 이벤트 객체 타입
 * @property groupName - [신규] 이벤트가 속한 그룹의 이름 (ownerType이 'GROUP'일 경우)
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
  groupName?: string; // 그룹 이름 추가
  color?: string;
  rrule?: string;
  description?: string;
  tasks?: EventTask[];
  participants?: EventParticipant[];
  isEditable?: boolean;
  createdBy?: number;
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

// export interface GroupEventCreateRequest extends UserEventCreateRequest {}

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