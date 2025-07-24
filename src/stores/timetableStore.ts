/**
 * @description 대학 시간표(Course) 관련 상태와 CRUD 로직을 관리하는 Zustand 스토어입니다.
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

const getDefaultSemesterKey = () => {
    const month = new Date().getMonth() + 1;
    const year = new Date().getFullYear();
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

            setSemesterKey: (key: string) => {
                set({ semesterKey: key });
                get().fetchCourses();
            },

            fetchCourses: async () => {
                const { semesterKey } = get();
                set({ isLoading: true });
                try {
                    const response = await getCourses(semesterKey);
                    set({ courses: response.data });
                } catch (error) { // [오류 수정] error 변수 사용
                    toast.error("시간표를 불러오는 데 실패했습니다.");
                    console.error("시간표 조회 실패:", error);
                } finally {
                    set({ isLoading: false });
                }
            },

            saveCourse: async (courseData: Course) => {
                const promise = courseData.id
                    ? updateCourse(courseData.id, courseData)
                    : createCourse({ ...courseData, courseCode: courseData.courseCode || "N/A" });

                await toast.promise(promise, {
                    loading: '강의 정보 저장 중...',
                    success: '저장되었습니다.',
                    error: (err: AxiosError<{ message?: string }>) => err.response?.data?.message || "저장에 실패했습니다.",
                });

                await get().fetchCourses();
                useEventStore.getState().fetchEvents();
            },

            deleteCourse: async (courseId: number) => {
                await toast.promise(deleteCourse(courseId), {
                    loading: '삭제 중...',
                    success: '삭제되었습니다.',
                    error: '삭제에 실패했습니다.',
                });

                await get().fetchCourses();
                useEventStore.getState().fetchEvents();
            },

            reset: () => set({ courses: [], semesterKey: getDefaultSemesterKey(), isLoading: false }),
        }),
        { name: "TimetableStore" }
    )
);