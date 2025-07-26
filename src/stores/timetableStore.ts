/**
 * @description 대학 시간표(Course) 관련 상태와 CRUD 로직을 관리하는 Zustand 스토어.
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import toast from 'react-hot-toast';
import type { Course } from '../types';
import { getCourses, createCourse, updateCourse, deleteCourse } from '../api/timetable';
import { useEventStore } from './eventStore';
import { AxiosError } from 'axios';

interface TimetableState {
    courses: Course[];
    semesterKey: string;
    isLoading: boolean;
    setSemesterKey: (key: string) => void;
    fetchCourses: () => Promise<void>;
    saveCourse: (courseData: Course) => Promise<void>;
    deleteCourse: (courseId: number) => Promise<void>;
    reset: () => void;
}

// 현재 날짜를 기준으로 기본 학기 키(e.g., "2025-S1")를 생성하는 헬퍼 함수
const getDefaultSemesterKey = (): string => {
    const month = new Date().getMonth() + 1;
    const year = new Date().getFullYear();
    // 2월~7월: 1학기, 8월~12월: 2학기, 그 외: 1학기로 기본값 설정
    if (month >= 2 && month <= 7) return `${year}-S1`;
    if (month >= 8 && month <= 12) return `${year}-S2`;
    return `${year}-S1`;
};

export const useTimetableStore = create<TimetableState>()(
    devtools(
        (set, get) => ({
            courses: [],
            semesterKey: getDefaultSemesterKey(),
            isLoading: false,

            /**
             * @description 현재 조회할 학기를 변경하고, 해당 학기의 강의 목록을 다시 불러옴.
             * @param key - "YYYY-S1" 형식의 학기 키
             */
            setSemesterKey: (key: string) => {
                set({ semesterKey: key });
                get().fetchCourses(); // 학기 변경 시 자동으로 데이터 새로고침
            },

            /**
             * @description 현재 `semesterKey`에 해당하는 강의 목록을 서버에서 가져옴.
             */
            fetchCourses: async () => {
                const { semesterKey } = get();
                set({ isLoading: true });
                try {
                    const response = await getCourses(semesterKey);
                    set({ courses: response.data, isLoading: false });
                } catch (error) {
                    toast.error("시간표를 불러오는 데 실패했습니다.");
                    console.error("시간표 조회 실패:", error);
                    set({ isLoading: false });
                }
            },

            /**
             * @description 새 강의를 생성하거나 기존 강의 수정.
             * @param courseData - 저장할 강의 데이터
             */
            saveCourse: async (courseData: Course) => {
                const promise = courseData.id
                    ? updateCourse(courseData.id, courseData)
                    : createCourse({ ...courseData, courseCode: courseData.courseCode || "N/A" });

                await toast.promise(promise, {
                    loading: '강의 정보 저장 중...',
                    success: '저장되었습니다.',
                    error: (err: AxiosError<{ message?: string }>) => err.response?.data?.message || "저장에 실패했습니다.",
                });

                // 성공 후, 시간표와 캘린더 데이터를 모두 새로고침하여 동기화
                await get().fetchCourses();
                useEventStore.getState().fetchEvents();
            },

            /**
             * @description 강의 삭제.
             * @param courseId - 삭제할 강의의 ID
             */
            deleteCourse: async (courseId: number) => {
                await toast.promise(deleteCourse(courseId), {
                    loading: '삭제 중...',
                    success: '삭제되었습니다.',
                    error: '삭제에 실패했습니다.',
                });

                // 성공 후, 시간표와 캘린더(이벤트) 데이터를 모두 새로고침하여 동기화
                await get().fetchCourses();
                useEventStore.getState().fetchEvents();
            },

            /**
             * @description 스토어 상태를 초기화 (로그아웃 시 사용).
             */
            reset: () => set({ courses: [], semesterKey: getDefaultSemesterKey(), isLoading: false }),
        }),
        { name: "TimetableStore" }
    )
);