/**
 * @description 개인 및 그룹의 모든 일정(Event)과 할 일(Task)을 중앙에서 관리하는 Zustand 스토어.
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';
import { AxiosError } from 'axios';

// --- 타입 정의 ---
import type {
    ScheduleEvent, EventTask, UserEventCreateRequest, GroupEventCreateRequest,
    UpdateTaskRequest, EventTaskCreateRequest, EventParticipant
} from '../types';

// --- API 함수 ---
import {
    getMyEvents, createPersonalEvent, updatePersonalEvent, deletePersonalEvent,
    createGroupEvent, updateGroupEvent, deleteGroupEvent, transformToScheduleEvent,
    createTaskForEvent, updateParticipantStatus
} from '../api/events';
import { getMyGroups } from '../api/groups';
import { updateTask as updateTaskApi, deleteTask as deleteTaskApi } from '../api/tasks';

// --- 다른 스토어 ---
import { useAuthStore } from './authStore';

// --- 스토어 상태 및 액션 타입 정의 ---
interface EventState {
    events: ScheduleEvent[];
    tasks: EventTask[];
    isLoading: boolean;
    fetchEvents: (contextGroupId?: number) => Promise<void>;
    saveEvent: (eventData: ScheduleEvent) => Promise<{ success: boolean; updatedEvent?: ScheduleEvent }>;
    deleteEvent: (eventData: ScheduleEvent) => Promise<void>;
    addTask: (eventId: number, taskData: EventTaskCreateRequest) => Promise<EventTask | null>;
    updateTask: (taskId: number, data: UpdateTaskRequest) => Promise<boolean>;
    deleteTask: (taskId: number) => Promise<boolean>;
    updateMyParticipation: (groupId: number, eventId: number, status: EventParticipant['status']) => Promise<boolean>;
    reset: () => void;
}

export const useEventStore = create<EventState>()(
    devtools(
        (set, get) => ({
            // --- 초기 상태 ---
            events: [],
            tasks: [],
            isLoading: true,

            /**
             * @description 서버에서 사용자의 모든 일정을 가져와 상태 업데이트.
             * @param contextGroupId - 현재 그룹 페이지 ID. 그룹 일정의 수정 권한을 결정하는 데 사용.
             */
            fetchEvents: async (contextGroupId?: number) => {
                set({ isLoading: true });
                try {
                    const [groupsRes, eventsRes] = await Promise.all([getMyGroups(), getMyEvents()]);
                    const currentUserId = useAuthStore.getState().user?.id;

                    const allTasks: EventTask[] = [];
                    const transformedEvents = eventsRes.map(event => {
                        const scheduleEvent = transformToScheduleEvent(event, groupsRes.data);
                        const isParticipant = event.participants.some(p => p.userId === currentUserId);

                        scheduleEvent.isEditable = event.ownerType === 'USER' || (event.ownerId === contextGroupId && isParticipant);
                        scheduleEvent.createdBy = event.createdBy;

                        if (scheduleEvent.tasks) {
                            allTasks.push(...scheduleEvent.tasks);
                        }
                        return scheduleEvent;
                    });
                    set({ events: transformedEvents, tasks: allTasks, isLoading: false });
                } catch (err) {
                    const error = err as AxiosError;
                    toast.error("일정 정보를 불러오는 데 실패했습니다.");
                    console.error("일정 조회 실패:", error);
                    set({ isLoading: false });
                }
            },

            /**
             * @description 새 일정을 생성하거나 기존 일정 업데이트.
             */
            saveEvent: async (eventData) => {
                const isNew = String(eventData.id).startsWith('temp-');
                const requestData = {
                    title: eventData.title,
                    description: eventData.description,
                    location: eventData.location,
                    startDatetime: dayjs(eventData.start).format('YYYY-MM-DDTHH:mm:ss'),
                    endDatetime: eventData.end ? dayjs(eventData.end).format('YYYY-MM-DDTHH:mm:ss') : dayjs(eventData.start).format('YYYY-MM-DDTHH:mm:ss'),
                    allDay: eventData.allDay,
                    rrule: eventData.rrule,
                    themeColor: eventData.color,
                };

                try {
                    let savedEventId: number;
                    if (isNew) {
                        const apiCall = eventData.ownerType === 'USER'
                            ? createPersonalEvent(requestData as UserEventCreateRequest)
                            : createGroupEvent(eventData.ownerId, requestData as GroupEventCreateRequest);
                        const response = await apiCall;
                        savedEventId = response.data.eventId;
                    } else {
                        savedEventId = parseInt(eventData.id, 10);
                        const apiCall = eventData.ownerType === 'USER'
                            ? updatePersonalEvent(savedEventId, requestData)
                            : updateGroupEvent(eventData.ownerId, savedEventId, requestData);
                        await apiCall;
                    }

                    const allEvents = await getMyEvents();
                    const finalEvent = allEvents.find(e => e.eventId === savedEventId);

                    if (finalEvent) {
                        const groups = await getMyGroups();
                        const updatedEvent = transformToScheduleEvent(finalEvent, groups.data);
                        const isParticipant = finalEvent.participants.some(p => p.userId === useAuthStore.getState().user?.id);
                        updatedEvent.isEditable = finalEvent.ownerType === 'USER' || isParticipant;

                        return { success: true, updatedEvent };
                    }
                    return { success: false };

                } catch (err) {
                    const error = err as AxiosError<{ message?: string }>;
                    toast.error(error.response?.data?.message || '일정 저장에 실패했습니다.');
                    console.error("Save Event Error:", error);
                    return { success: false };
                }
            },

            deleteEvent: async (eventData) => {
                const eventId = parseInt(eventData.id, 10);
                const apiCall = eventData.ownerType === 'USER'
                    ? deletePersonalEvent(eventId)
                    : deleteGroupEvent(eventData.ownerId, eventId);

                await toast.promise(apiCall, {
                    loading: '삭제 중...',
                    success: () => {
                        set(state => ({
                            events: state.events.filter(e => e.id !== eventData.id)
                        }));
                        return '삭제되었습니다.';
                    },
                    error: (err) => {
                        console.error("Delete Event Error:", err);
                        return '삭제에 실패했습니다.';
                    },
                });
            },

            addTask: async (eventId, taskData) => {
                try {
                    const response = await toast.promise(createTaskForEvent(eventId, taskData), {
                        loading: '할 일 추가 중...',
                        success: '할 일이 추가되었습니다.',
                        error: '추가에 실패했습니다.',
                    });
                    get().fetchEvents(); // 성공 후 데이터 재조회
                    return {
                        id: response.data.id,
                        eventId: String(eventId),
                        title: response.data.title,
                        status: response.data.statusCode as EventTask['status'],
                        dueDate: response.data.dueDatetime,
                    };
                } catch (err) {
                    console.error("Add Task Error:", err);
                    return null;
                }
            },

            updateTask: async (taskId, data) => {
                try {
                    await toast.promise(updateTaskApi(taskId, data), {
                        loading: '할 일 업데이트 중...',
                        success: '업데이트 되었습니다.',
                        error: '업데이트에 실패했습니다.',
                    });
                    get().fetchEvents(); // 성공 후 데이터 재조회
                    return true;
                } catch (err) {
                    console.error("Update Task Error:", err);
                    return false;
                }
            },

            deleteTask: async (taskId) => {
                try {
                    await toast.promise(deleteTaskApi(taskId), {
                        loading: '삭제 중...',
                        success: '삭제되었습니다.',
                        error: '삭제에 실패했습니다.',
                    });
                    get().fetchEvents(); // 성공 후 데이터 재조회
                    return true;
                } catch (err) {
                    console.error("Delete Task Error:", err);
                    return false;
                }
            },

            updateMyParticipation: async (groupId, eventId, status) => {
                try {
                    await updateParticipantStatus(groupId, eventId, status);
                    return true;
                } catch (err) {
                    console.error("Update Participation Error:", err);
                    return false;
                }
            },

            reset: () => set({ events: [], tasks: [], isLoading: true }),
        }),
        { name: "EventStore" }
    )
);