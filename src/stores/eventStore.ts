/**
 * @file eventStore.ts
 * @description 개인 및 그룹의 모든 일정(Event)과 할 일(Task)을 관리하는 Zustand 스토어.
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';
import { AxiosError } from 'axios';

// Types
import type {
    ScheduleEvent, EventTask, UserEventCreateRequest, GroupEventCreateRequest,
    UpdateTaskRequest, EventTaskCreateRequest, EventParticipant
} from '../types';

// APIs
import {
    getMyEvents, createPersonalEvent, updatePersonalEvent, deletePersonalEvent,
    createGroupEvent, updateGroupEvent, deleteGroupEvent, transformToScheduleEvent,
    createTaskForEvent, updateParticipantStatus
} from '../api/events';
import { getMyGroups } from '../api/groups';
import { updateTask, deleteTask } from '../api/tasks';
import { useAuthStore } from './authStore';

// 스토어의 상태 및 액션 타입 정의
interface EventState {
    events: ScheduleEvent[];
    tasks: EventTask[];
    isLoading: boolean;
    fetchEvents: () => Promise<void>;
    saveEvent: (eventData: ScheduleEvent) => Promise<boolean>;
    deleteEvent: (eventData: ScheduleEvent) => Promise<void>;
    updateTask: (taskId: number, data: UpdateTaskRequest) => Promise<void>;
    deleteTask: (taskId: number) => Promise<void>;
    addTask: (eventId: number, taskData: Omit<EventTask, 'id' | 'eventId'>) => Promise<void>;
    updateMyParticipation: (groupId: number, eventId: number, status: EventParticipant['status']) => Promise<void>;
    reset: () => void;
}

// 할 일 상태 코드를 ID로 변환하기 위한 맵
const statusMap: { [key in EventTask['status']]: number } = { 'TODO': 1, 'DOING': 2, 'DONE': 3 };

export const useEventStore = create<EventState>()(
    devtools(
        (set, get) => ({
            events: [],
            tasks: [],
            isLoading: true,

            fetchEvents: async () => {
                set({ isLoading: true });
                try {
                    const [groupsRes, eventsRes] = await Promise.all([getMyGroups(), getMyEvents()]);
                    const currentUserId = useAuthStore.getState().user?.id;

                    const allTasks: EventTask[] = [];
                    const transformedEvents = eventsRes.map(event => {
                        const scheduleEvent = transformToScheduleEvent(event, groupsRes.data);
                        scheduleEvent.isEditable = event.ownerType === 'USER' || event.createdBy === currentUserId;
                        scheduleEvent.createdBy = event.createdBy;
                        if (scheduleEvent.tasks) allTasks.push(...scheduleEvent.tasks);
                        return scheduleEvent;
                    });
                    set({ events: transformedEvents, tasks: allTasks, isLoading: false });
                } catch (error) {
                    toast.error("일정 정보를 불러오는 데 실패했습니다.");
                    console.error("일정 조회 실패:", error);
                    set({ isLoading: false });
                }
            },

            saveEvent: async (eventData) => {
                const isNew = String(eventData.id).startsWith('temp-');
                const currentUserId = useAuthStore.getState().user?.id;

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

                let success = false;
                await toast.promise(
                    (async () => {
                        if (isNew) {
                            const apiCall = eventData.ownerType === 'USER'
                                ? createPersonalEvent(requestData as UserEventCreateRequest)
                                : createGroupEvent(eventData.ownerId, requestData as GroupEventCreateRequest);
                            const response = await apiCall;
                            const newEventId = response.data.eventId;

                            if (eventData.tasks && eventData.tasks.length > 0) {
                                const taskPromises = eventData.tasks.map(task => {
                                    const taskData: EventTaskCreateRequest = {
                                        title: task.title,
                                        statusId: statusMap[task.status],
                                        assigneeId: currentUserId,
                                        dueDatetime: task.dueDate ? dayjs(task.dueDate).format('YYYY-MM-DDTHH:mm:ss') : null,
                                    };
                                    return createTaskForEvent(newEventId, taskData);
                                });
                                await Promise.all(taskPromises);
                            }
                        } else {
                            const eventId = parseInt(eventData.id);
                            const apiCall = eventData.ownerType === 'USER'
                                ? updatePersonalEvent(eventId, requestData)
                                : updateGroupEvent(eventData.ownerId, eventId, requestData);
                            await apiCall;
                        }
                    })(),
                    {
                        loading: '일정 저장 중...',
                        success: () => {
                            success = true;
                            return '일정이 저장되었습니다.';
                        },
                        error: (err: AxiosError<{ message?: string }>) => err.response?.data?.message || '일정 저장에 실패했습니다.',
                    }
                );

                if (success) await get().fetchEvents();
                return success;
            },

            deleteEvent: async (eventData) => {
                const apiCall = eventData.ownerType === 'USER'
                    ? deletePersonalEvent(parseInt(eventData.id))
                    : deleteGroupEvent(eventData.ownerId, parseInt(eventData.id));

                await toast.promise(apiCall, {
                    loading: '삭제 중...',
                    success: () => {
                        set(state => ({ events: state.events.filter(e => e.id !== eventData.id) }));
                        return '삭제되었습니다.';
                    },
                    error: '삭제에 실패했습니다.',
                });
            },

            updateTask: async (taskId, data) => {
                await toast.promise(updateTask(taskId, data), {
                    loading: '할 일 업데이트 중...',
                    success: '업데이트 되었습니다.',
                    error: '업데이트에 실패했습니다.',
                });
                await get().fetchEvents();
            },

            deleteTask: async (taskId) => {
                await toast.promise(deleteTask(taskId), {
                    loading: '삭제 중...',
                    success: '삭제되었습니다.',
                    error: '삭제에 실패했습니다.',
                });
                await get().fetchEvents();
            },

            addTask: async (eventId, taskData) => {
                const request: EventTaskCreateRequest = {
                    title: taskData.title,
                    statusId: statusMap[taskData.status],
                    dueDatetime: taskData.dueDate,
                    assigneeId: useAuthStore.getState().user?.id
                };
                await toast.promise(createTaskForEvent(eventId, request), {
                    loading: '할 일 추가 중...',
                    success: '할 일이 추가되었습니다.',
                    error: '추가에 실패했습니다.',
                });
                await get().fetchEvents();
            },

            updateMyParticipation: async (groupId, eventId, status) => {
                await toast.promise(updateParticipantStatus(groupId, eventId, status), {
                    loading: '상태 변경 중...',
                    success: '참여 상태가 변경되었습니다.',
                    error: '상태 변경에 실패했습니다.',
                });
                await get().fetchEvents();
            },

            reset: () => set({ events: [], tasks: [], isLoading: true }),
        }),
        { name: "EventStore" }
    )
);
