export interface GroupListDto {
    id: number;
    name: string;
    code: string;
    themeColor: string;
}

// 그룹 멤버 정보
export interface GroupMember {
    userId: number;
    userName: string;
    role: string;
}

// 그룹 상세 정보
export interface Group {
    id: number;
    name: string;
    code: string;
    initials: string;
    color: string;
    colorValue: string;
    themeColor: string;
    members: GroupMember[];
    memberCount: number;
}