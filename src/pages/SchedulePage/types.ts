//예시 타입 명시 실제 DB랑 조금 다름. 임시임
export interface ScheduleEvent {
  id: string; // 반복 인스턴스일 때도 고유 (id+날짜)
  originalId?: string; // 반복 인스턴스의 원본 id
  title: string;
  start: string;
  end: string;
  allDay: boolean;
  location?: string;
  ownerType: 'USER' | 'GROUP';
  ownerId: number;
  color?: string;
  rrule?: string;
  description?: string;
  tasks?: EventTask[]; // 해당 이벤트에 종속된 할 일 목록
}

// [수정] EventTask 인터페이스를 DB 스키마에 맞게 변경
export interface EventTask {
  id: number;
  eventId: string; // ScheduleEvent의 인스턴스 ID (예: event-1-20250711)
  title: string;
  status: 'TODO' | 'DOING' | 'DONE';
  dueDate: string | null; 
}
// 대학 강의 데이터 타입
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