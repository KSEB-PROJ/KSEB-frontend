// 대시보드 API 응답 데이터 타입
export interface DashboardData {
    totalUsers: number;
    todayRegisteredUsers: number;
    totalGroups: number;
}

// 관리자용 사용자 정보 타입
export interface UserAdmin {
    id: number;
    email: string;
    name: string;
    role: 'ROLE_USER' | 'ROLE_ADMIN';
    createdAt: string;
}

// 관리자용 그룹 정보 타입
export interface GroupAdmin {
    id: number;
    name: string;
    createdBy: string;
    memberCount: number;
    createdAt: string;
}

// 관리자용 로그 정보 타입
export interface LogAdmin {
    id: number;
    actorName: string;
    actionType: ActionTypeKey;
    actionDescription: string;
    targetId: number;
    details: string;
    createdAt: string;
}

// 페이지네이션 응답 타입 (사용자)
export interface PagedAdminUserResponse {
    content: UserAdmin[];
    totalPages: number;
    totalElements: number;
    number: number; // 현재 페이지 번호
    size: number; // 페이지 크기
}

// 페이지네이션 응답 타입 (그룹)
export interface PagedAdminGroupResponse {
    content: GroupAdmin[];
    totalPages: number;
    totalElements: number;
    number: number;
    size: number;
}

// 페이지네이션 응답 타입 (로그)
export interface PagedAdminLogResponse {
    content: LogAdmin[];
    totalPages: number;
    totalElements: number;
    number: number;
    size: number;
}

// ActionType을 enum 대신 const 객체로 정의
export const ActionType = {
    USER_LOGIN: "사용자 로그인",
    USER_LOGOUT: "사용자 로그아웃",
    USER_REGISTER: "사용자 회원가입",
    USER_UPDATE_INFO: "사용자 정보 수정",
    USER_DELETE: "사용자 탈퇴",
    GROUP_CREATE: "그룹 생성",
    GROUP_DELETE: "그룹 삭제",
    GROUP_INVITE_USER: "사용자 그룹 초대",
    GROUP_JOIN_USER: "사용자 그룹 참가",
    GROUP_LEAVE_USER: "사용자 그룹 탈퇴",
    CHANNEL_CREATE: "채널 생성",
    CHANNEL_DELETE: "채널 삭제",
    MESSAGE_SEND: "메시지 전송",
    MESSAGE_UPDATE: "메시지 수정",
    MESSAGE_DELETE: "메시지 삭제",
    NOTICE_CREATE: "공지 생성",
    NOTICE_UPDATE: "공지 수정",
    NOTICE_DELETE: "공지 삭제",
    EVENT_CREATE: "일정 생성",
    EVENT_UPDATE: "일정 수정",
    EVENT_DELETE: "일정 삭제",
    ADMIN_CHANGE_USER_ROLE: "관리자 사용자 역할 변경",
    ADMIN_DELETE_USER: "관리자 사용자 강제 탈퇴",
    ADMIN_DELETE_GROUP: "관리자 그룹 강제 삭제",
} as const;

// ActionType 객체의 키들을 타입으로 추출
export type ActionTypeKey = keyof typeof ActionType;