/**
 * @file CalendarPage.tsx
 * @description 특정 그룹의 일정을 보여주는 캘린더 페이지 컴포넌트입니다.
 * - URL 파라미터(`groupId`)를 통해 현재 보고 있는 그룹을 식별합니다.
 * - Zustand의 `useEventStore`에서 전체 일정 데이터를 가져온 후, 현재 그룹에 해당하는 일정만 필터링하여 표시합니다.
 * - 그룹 일정의 생성, 수정, 삭제 로직은 모두 `eventStore`의 액션을 통해 처리됩니다.
 * - SchedulePage와 많은 UI/로직을 공유하지만, 그룹 컨텍스트에 특화되어 있습니다.
 */

import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import FullCalendar from '@fullcalendar/react';
import type { EventClickArg, EventInput, EventContentArg, EventApi } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin, { type DateClickArg } from '@fullcalendar/interaction';
import { RRule } from 'rrule';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { IconDefinition } from '@fortawesome/free-solid-svg-icons';
import { faPlus, faLayerGroup, faCalendarDays, faChevronLeft, faChevronRight, faCircle, faCircleHalfStroke, faCircleCheck } from '@fortawesome/free-solid-svg-icons';
import 'dayjs/locale/ko';

import schedulePageStyles from '../AppLayout/SchedulePage/SchedulePage.module.css';
import type { ScheduleEvent, EventTask } from '../../types'; // ✅ 미사용 타입 제거 및 경로 수정
import EventEditorModal from '../AppLayout/SchedulePage/EventEditorModal/EventEditorModal';

// Zustand 스토어 import
import { useEventStore } from '../../stores/eventStore'; // ✅ 경로 수정
import { useGroupStore } from '../../stores/groupStore'; // ✅ 경로 수정
import { useAuthStore } from '../../stores/authStore'; // ✅ 경로 수정

dayjs.extend(isBetween);
dayjs.locale('ko');

// 할 일 상태 ID 맵
const statusMap: { [key in EventTask['status']]: number } = { 'TODO': 1, 'DOING': 2, 'DONE': 3 };

// 헬퍼 함수
const getEventInstanceId = (event: ScheduleEvent, date: Date | string): string => {
    if (!event.rrule) return event.id;
    return `${event.id}-${dayjs(date).format('YYYYMMDD')}`;
};

const CalendarPage: React.FC = () => {
    const { groupId } = useParams<{ groupId: string }>();
    const calendarRef = useRef<FullCalendar>(null);
    const clickTimeout = useRef<number | null>(null);

    const { events, tasks, isLoading, fetchEvents, saveEvent, deleteEvent, updateTask, addTask } = useEventStore();
    const { selectedGroup } = useGroupStore();
    const { user: currentUser } = useAuthStore();

    const [currentTitle, setCurrentTitle] = useState('');
    const [agendaDate, setAgendaDate] = useState(new Date());
    const [viewRange, setViewRange] = useState({ start: new Date(), end: new Date() });
    const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEvent, setEditingEvent] = useState<ScheduleEvent | null>(null);

    useEffect(() => {
        fetchEvents();
    }, [fetchEvents]);

    const groupEvents = useMemo(() => {
        if (!groupId) return [];
        const numericGroupId = parseInt(groupId, 10);
        return events.filter((event: ScheduleEvent) => event.ownerType === 'GROUP' && event.ownerId === numericGroupId);
    }, [events, groupId]);

    const processedEvents = useMemo((): EventInput[] => {
        const calendarEvents: EventInput[] = [];
        const viewStart = dayjs(viewRange.start).startOf('day');
        const viewEnd = dayjs(viewRange.end).endOf('day');

        groupEvents.forEach((event: ScheduleEvent) => {
            const eventStyleOptions = {
                ...event,
                display: 'block',
                classNames: [schedulePageStyles.calendarEvent],
                backgroundColor: 'transparent',
                borderColor: 'transparent',
                textColor: '#E0E0E0',
                extendedProps: { ...event }
            };

            if (event.rrule && event.end) {
                try {
                    const rule = new RRule({ ...RRule.parseString(event.rrule), dtstart: dayjs(event.start).toDate() });
                    rule.between(viewStart.toDate(), viewEnd.toDate()).forEach(date => {
                        const duration = dayjs(event.end!).diff(dayjs(event.start));
                        const instanceStart = dayjs(date);
                        const instanceEnd = instanceStart.add(duration, 'ms');
                        calendarEvents.push({ ...eventStyleOptions, id: getEventInstanceId(event, date), start: instanceStart.toDate(), end: instanceEnd.toDate() });
                    });
                } catch (e) { console.error("Error parsing rrule:", e); }
            } else {
                if (dayjs(event.start).isBefore(viewEnd) && dayjs(event.end ?? event.start).isAfter(viewStart)) {
                    calendarEvents.push({ ...eventStyleOptions, id: event.id });
                }
            }
        });
        return calendarEvents;
    }, [groupEvents, viewRange]);

    const renderEventContent = (eventInfo: EventContentArg) => {
        const props = eventInfo.event.extendedProps as ScheduleEvent;
        const color = props.color || '#888';
        return (
            <div className={`${schedulePageStyles.eventContent} ${eventInfo.event.allDay ? schedulePageStyles.allDayStyle : schedulePageStyles.timedStyle}`} style={{ '--event-theme-color': color } as React.CSSProperties}>
                <FontAwesomeIcon icon={faLayerGroup} className={schedulePageStyles.eventIcon} />
                <span className={schedulePageStyles.eventTitle}>{eventInfo.event.title}</span>
            </div>
        );
    };
    
    const handleDateClick = (arg: DateClickArg) => {
        if (!selectedGroup || !currentUser) return;
        if (clickTimeout.current) {
            clearTimeout(clickTimeout.current);
            clickTimeout.current = null;
            
            const startDate = dayjs(arg.date);
            const newEventStart = arg.allDay ? startDate.startOf('day').format('YYYY-MM-DDTHH:mm:ss') : startDate.format('YYYY-MM-DDTHH:mm:ss');
            const newEventEnd = arg.allDay ? startDate.endOf('day').format('YYYY-MM-DDTHH:mm:ss') : startDate.add(1, 'hour').format('YYYY-MM-DDTHH:mm:ss');

            setEditingEvent({
                id: `temp-${Date.now()}`,
                title: '',
                start: newEventStart,
                end: newEventEnd,
                allDay: arg.allDay,
                ownerType: 'GROUP',
                ownerId: selectedGroup.id,
                groupName: selectedGroup.name,
                tasks: [],
                participants: selectedGroup.members.map(m => ({ userId: m.userId, userName: m.userName, status: 'TENTATIVE' })),
                isEditable: true,
                createdBy: currentUser.id
            });
            setIsModalOpen(true);
        } else {
            clickTimeout.current = window.setTimeout(() => {
                setAgendaDate(arg.date);
                clickTimeout.current = null;
            }, 250);
        }
    };
    
    const openEditorForEvent = useCallback((event: EventApi | EventInput) => {
        const props = event.extendedProps as ScheduleEvent;
        setEditingEvent(props);
        setIsModalOpen(true);
        setSelectedEventId(event.id as string);
    }, []);

    const handleEventClick = useCallback((arg: EventClickArg) => {
        openEditorForEvent(arg.event);
    }, [openEditorForEvent]);
    
    const handleSaveEvent = async (eventData: ScheduleEvent) => {
        const success = await saveEvent(eventData);
        if (success) setIsModalOpen(false);
    };

    const handleDeleteEvent = async (eventId: string) => {
        const originalEventId = eventId.split('-')[0];
        const eventToDelete = events.find((e: ScheduleEvent) => e.id === originalEventId);
        if(eventToDelete){
            await deleteEvent(eventToDelete);
            setIsModalOpen(false);
        }
    };
    
    const handleEventUpdate = () => {
        fetchEvents();
    };

    const todaysEvents = useMemo(() =>
        processedEvents
            .filter((e: EventInput) => dayjs(e.start as string).isSame(agendaDate, 'day'))
            .sort((a, b) => dayjs((a.start as Date)).valueOf() - dayjs((b.start as Date)).valueOf()),
        [processedEvents, agendaDate]
    );

    const selectedEvent = useMemo(() => processedEvents.find((e: EventInput) => e.id === selectedEventId), [processedEvents, selectedEventId]);

    const selectedEventTasks = useMemo(() => {
        if (!selectedEventId) return [];
        const originalId = (selectedEvent?.extendedProps as ScheduleEvent)?.id || selectedEventId;
        const eventIdToMatch = originalId.split('-')[0];
        return tasks.filter((t: EventTask) => t.eventId === eventIdToMatch);
    }, [tasks, selectedEventId, selectedEvent]);
    
    const handleToggleTask = (taskId: number) => {
        const taskToUpdate = tasks.find((t: EventTask) => t.id === taskId);
        if (!taskToUpdate) return;
        const statusCycle: { [key in EventTask['status']]: EventTask['status'] } = { 'TODO': 'DOING', 'DOING': 'DONE', 'DONE': 'TODO' };
        const nextStatus = statusCycle[taskToUpdate.status];
        updateTask(taskId, { statusId: statusMap[nextStatus] });
    };

    const handleAddTask = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && selectedEventId && e.currentTarget.value.trim()) {
            const originalId = (selectedEvent?.extendedProps as ScheduleEvent)?.id || selectedEventId;
            const eventId = parseInt(originalId.split('-')[0], 10);
            const newTaskData = { 
                title: e.currentTarget.value.trim(), 
                status: 'TODO' as const, 
                dueDate: null 
            };
            addTask(eventId, newTaskData);
            e.currentTarget.value = '';
        }
    };

    useEffect(() => {
        if (todaysEvents.length > 0 && !todaysEvents.some((e: EventInput) => e.id === selectedEventId)) {
            setSelectedEventId(todaysEvents[0].id!);
        } else if (todaysEvents.length === 0) {
            setSelectedEventId(null);
        }
    }, [todaysEvents, selectedEventId]);

    const handleNav = (action: 'prev' | 'next' | 'today') => {
        calendarRef.current?.getApi()[action]();
        if (action === 'today') setAgendaDate(new Date());
    };

    const TaskStatusIcon = ({ status }: { status: EventTask['status'] }) => {
        // ✅ Record 유틸리티 타입을 사용하여 iconMap의 타입을 명확히 함
        const iconMap: Record<EventTask['status'], IconDefinition> = { 
            'TODO': faCircle, 
            'DOING': faCircleHalfStroke, 
            'DONE': faCircleCheck 
        };
        return <FontAwesomeIcon icon={iconMap[status]} title={status} />;
    };

    if (isLoading) {
        return <div className={schedulePageStyles.pageContainer}><h1>로딩 중...</h1></div>;
    }

    return (
        <>
            <div className={schedulePageStyles.pageContainer}>
                <div className={`${schedulePageStyles.panel} ${schedulePageStyles.calendarWrapper}`} style={{ flex: 2, minWidth: '400px' }}>
                    <div className={schedulePageStyles.calendarHeader}>
                        <div className={schedulePageStyles.headerControls}>
                            <button onClick={() => handleNav('prev')} className={schedulePageStyles.navButton}><FontAwesomeIcon icon={faChevronLeft} /></button>
                            <span className={schedulePageStyles.headerTitle}>{currentTitle}</span>
                            <button onClick={() => handleNav('next')} className={schedulePageStyles.navButton}><FontAwesomeIcon icon={faChevronRight} /></button>
                        </div>
                        <button onClick={() => handleNav('today')} className={schedulePageStyles.todayButton}>Today</button>
                    </div>
                    <div className={schedulePageStyles.calendarContent}>
                        <FullCalendar
                            ref={calendarRef}
                            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                            initialView="dayGridMonth"
                            headerToolbar={false}
                            dayMaxEvents={2}
                            events={processedEvents}
                            editable
                            selectable
                            eventClick={handleEventClick}
                            dateClick={handleDateClick}
                            datesSet={(arg) => {
                                setCurrentTitle(arg.view.title);
                                setViewRange({ start: arg.view.activeStart, end: arg.view.activeEnd });
                            }}
                            locale='ko'
                            eventContent={renderEventContent}
                        />
                    </div>
                </div>
                <div className={schedulePageStyles.rightColumn} key={dayjs(agendaDate).format('YYYYMMDD')}>
                    <div className={`${schedulePageStyles.panel} ${schedulePageStyles.agendaContainer} ${schedulePageStyles.animatedCard}`}>
                        <div className={schedulePageStyles.panelHeader}>
                            <h3><FontAwesomeIcon icon={faCalendarDays} /> Today's Agenda</h3>
                            <span className={schedulePageStyles.date}>{dayjs(agendaDate).format('MM월 DD일 dddd')}</span>
                        </div>
                        <div className={schedulePageStyles.scrollableContent}>
                            {todaysEvents.length > 0 ? (
                                <ul className={schedulePageStyles.agendaList}>
                                    {todaysEvents.map((event: EventInput) => (
                                        <li key={event.id} className={`${schedulePageStyles.agendaItem} ${selectedEventId === event.id ? schedulePageStyles.selected : ''}`} onClick={() => setSelectedEventId(event.id!)}>
                                            <div className={schedulePageStyles.agendaLeft}>
                                                <div className={schedulePageStyles.ownerIcon} style={{ backgroundColor: (event.extendedProps as ScheduleEvent).color }}><FontAwesomeIcon icon={faLayerGroup} /></div>
                                                <div className={schedulePageStyles.agendaInfo}>
                                                    <span className={schedulePageStyles.agendaTitle}>{event.title}</span>
                                                    <span className={schedulePageStyles.agendaTime}>{event.allDay ? '하루 종일' : `${dayjs(event.start as string).format('HH:mm')} - ${dayjs(event.end as string).format('HH:mm')}`}</span>
                                                </div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            ) : (<div className={schedulePageStyles.noItems}>오늘 등록된 그룹 일정이 없습니다.</div>)}
                        </div>
                    </div>
                    <div className={`${schedulePageStyles.panel} ${schedulePageStyles.todoContainer} ${schedulePageStyles.animatedCard}`} style={{ animationDelay: '0.1s' }}>
                        <div className={schedulePageStyles.panelHeader}>
                            <h3>To-Do List</h3>
                            <span className={schedulePageStyles.todoHeaderSubtitle}>{selectedEvent?.title || '일정 선택 필요'}</span>
                        </div>
                        <div className={schedulePageStyles.scrollableContent}>
                            {selectedEventId ? (
                                <ul className={schedulePageStyles.todoList}>
                                    {selectedEventTasks.length > 0 ? selectedEventTasks.map((task: EventTask) => (
                                        <li key={task.id} className={`${schedulePageStyles.todoItem} ${schedulePageStyles[task.status.toLowerCase()]}`}>
                                            <button className={schedulePageStyles.todoStatusButton} onClick={() => handleToggleTask(task.id)}><TaskStatusIcon status={task.status} /></button>
                                            <span className={schedulePageStyles.todoTitle} title={task.title}>{task.title}</span>
                                        </li>
                                    )) : <div className={schedulePageStyles.noItems}>할 일이 없습니다.</div>}
                                </ul>
                            ) : (<div className={schedulePageStyles.noItems}>일정을 선택하여 할 일을 확인하세요.</div>)}
                        </div>
                        {selectedEvent && (
                            <div className={schedulePageStyles.addTodoWrapper}>
                                <FontAwesomeIcon icon={faPlus} className={schedulePageStyles.addTodoIcon} />
                                <input type="text" placeholder="새로운 할 일 추가 (Enter)" className={schedulePageStyles.addTodoInput} onKeyDown={handleAddTask} />
                            </div>
                        )}
                    </div>
                </div>
            </div>
            {isModalOpen && 
                <EventEditorModal 
                    event={editingEvent} 
                    onClose={() => setIsModalOpen(false)} 
                    onSave={handleSaveEvent} 
                    onDelete={handleDeleteEvent} 
                    onEventUpdate={handleEventUpdate}
                />
            }
        </>
    );
};

export default CalendarPage;