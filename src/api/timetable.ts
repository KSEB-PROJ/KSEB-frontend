import apiClient from './index';
import type { Course } from '../types';


// 전체 강의 조회
export const getCourses = (semester: string) => {
    // 이제 모든 요청에 자동으로 JWT 토큰이 포함됩니다.
    return apiClient.get<Course[]>('/timetable', { params: { semester } });
};

// 강의 생성
export const createCourse = (courseData: Partial<Course>) => {
    return apiClient.post<Course>('/timetable', courseData);
};

// 강의 수정
export const updateCourse = (courseId: number, courseData: Partial<Course>) => {
    return apiClient.patch<Course>(`/timetable/${courseId}`, courseData);
};

// 강의 삭제
export const deleteCourse = (courseId: number) => {
    return apiClient.delete(`/timetable/${courseId}`);
};