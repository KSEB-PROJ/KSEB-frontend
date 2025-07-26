/**
 * @file SchedulePage.tsx
 * @description 개인 스케줄과 대학 시간표를 통합하여 보여주는 메인 스케줄 관리 페이지.
 */

import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import FullCalendar from '@fullcalendar/react';
import type { EventClickArg, EventInput, EventContentArg, EventApi } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin, { type DateClickArg } from '@fullcalendar/interaction';
import { RRule } from 'rrule';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faLayerGroup, faUser, faCalendarDays, faChevronLeft, faChevronRight, faCircle, faCircleHalfStroke, faCircleCheck } from '@fortawesome/free-solid-svg-icons';
import 'dayjs/locale/ko';

import styles from './SchedulePage.module.css';
import type { ScheduleEvent, EventTask, EventTaskCreateRequest } from '../../../types';
import EventEditorModal from './EventEditorModal/EventEditorModal';
import UniversityTimetable from './UniversityTimetable/UniversityTimetable';

// Zustand 스토어 import
import { useEventStore } from '../../../stores/eventStore';
import { useAuthStore } from '../../../stores/authStore';

dayjs.extend(isBetween);
dayjs.locale('ko');

// --- 상수 및 헬퍼 함수 ---
const statusMap: { [key in EventTask['status']]: number } = { 'TODO': 1, 'DOING': 2, 'DONE': 3 };

const getEventInstanceId = (event: ScheduleEvent, date: Date | string): string => {
    if (!event.rrule) return event.id;
    return `${event.id}-${dayjs(date).format('YYYYMMDD')}`;
};

// --- 메인 컴포넌트 ---
const SchedulePage: React.FC = () => {
    // --- Refs ---
    const calendarRef = useRef<FullCalendar>(null);
    const clickTimeout = useRef<number | null>(null);

    // --- 스토어 상태 및 액션 ---
    const { events, tasks, isLoading, fetchEvents, saveEvent, deleteEvent, addTask, updateTask } = useEventStore();
    const { user: currentUser } = useAuthStore();

    // --- 컴포넌트 상태 ---
    const [currentTitle, setCurrentTitle] = useState('');
    const [agendaDate, setAgendaDate] = useState(new Date());
    const [viewRange, setViewRange] = useState({ start: new Date(), end: new Date() });
    const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEvent, setEditingEvent] = useState<ScheduleEvent | null>(null);

    // --- 데이터 로딩 ---
    useEffect(() => {
        // 개인 스케줄 페이지에서는 그룹 컨텍스트가 없으므로 인자 없이 호출
        fetchEvents();
    }, [fetchEvents]);

    // --- 메모이제이션된 데이터 ---

    // 캘린더에 표시할 이벤트 목록 가공
    const processedEvents = useMemo((): EventInput[] => {
        const calendarEvents: EventInput[] = [];
        const viewStart = dayjs(viewRange.start).startOf('day');
        const viewEnd = dayjs(viewRange.end).endOf('day');

        events.forEach(event => {
            const eventStyleOptions = {
                ...event,
                display: 'block',
                classNames: [styles.calendarEvent],
                backgroundColor: 'transparent',
                borderColor: 'transparent',
                textColor: '#E0E0E0',
                extendedProps: { ...event }
            };

            if (event.rrule && event.end) {
                try {
                    const rule = new RRule({ ...RRule.parseString(event.rrule), dtstart: dayjs(event.start).toDate() });
                    rule.between(viewStart.toDate(), viewEnd.toDate()).forEach(date => {
                        const duration = dayjs(event.end).diff(dayjs(event.start));
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
    }, [events, viewRange]);
    
    // 오늘 날짜(agendaDate)에 해당하는 이벤트 목록
    const todaysEvents = useMemo(() =>
        processedEvents
            .filter(e => dayjs(e.start as string).isSame(agendaDate, 'day'))
            .sort((a, b) => {
                if ((a.allDay ?? false) && !(b.allDay ?? false)) return -1;
                if (!(a.allDay ?? false) && (b.allDay ?? false)) return 1;
                return dayjs(a.start as string).valueOf() - dayjs(b.start as string).valueOf()
            }),
        [processedEvents, agendaDate]
    );

    // 현재 선택된 이벤트 객체
    const selectedEvent = useMemo(() =>
        processedEvents.find(e => e.id === selectedEventId),
        [processedEvents, selectedEventId]
    );
    
    // 선택된 이벤트에 연결된 할 일 목록
    const selectedEventTasks = useMemo(() => {
        if (!selectedEventId) return [];
        const originalId = (selectedEvent?.extendedProps as ScheduleEvent)?.id || selectedEventId;
        const eventIdToMatch = originalId.split('-')[0];
        return tasks.filter(t => t.eventId === eventIdToMatch);
    }, [tasks, selectedEventId, selectedEvent]);
    
    // --- 핸들러 함수 ---

    // 일정 편집 모달을 여는 공통 함수
    const openEditorForEvent = useCallback((event: EventApi | EventInput | Partial<ScheduleEvent>) => {
        setEditingEvent(event as ScheduleEvent);
        setIsModalOpen(true);
        if (event.id) {
            setSelectedEventId(event.id as string);
        }
    }, []);

    // 날짜 클릭: 새 일정 생성 모드
    const handleDateClick = (arg: DateClickArg) => {
        if (!currentUser) return;

        if (clickTimeout.current) {
            clearTimeout(clickTimeout.current);
            clickTimeout.current = null;

            const newEvent: Partial<ScheduleEvent> = {
                id: `temp-${Date.now()}`,
                title: '',
                start: dayjs(arg.date).format('YYYY-MM-DDTHH:mm:ss'),
                end: dayjs(arg.date).add(1, 'hour').format('YYYY-MM-DDTHH:mm:ss'),
                allDay: arg.allDay,
                ownerType: 'USER',
                ownerId: currentUser.id,
                isEditable: true,
                createdBy: currentUser.id,
                tasks: [],
                participants: [{ userId: currentUser.id, userName: currentUser.name, status: 'ACCEPTED' }],
            };
            openEditorForEvent(newEvent);
        } else {
            clickTimeout.current = window.setTimeout(() => {
                setAgendaDate(arg.date);
                clickTimeout.current = null;
            }, 250);
        }
    };
    
    // 이벤트 클릭: 기존 일정 수정 모드
    const handleEventClick = useCallback((arg: EventClickArg) => {
        openEditorForEvent(arg.event.extendedProps as ScheduleEvent);
    }, [openEditorForEvent]);

    const handleSaveEvent = async (eventData: ScheduleEvent) => {
        const result = await saveEvent(eventData);
        if (result.success) {
            setIsModalOpen(false);
            fetchEvents();
        }
        return result;
    };

    const handleDeleteEvent = async (eventId: string) => {
        const originalEventId = eventId.split('-')[0];
        const eventToDelete = events.find(e => e.id === originalEventId);
        if (eventToDelete) {
            await deleteEvent(eventToDelete);
            setIsModalOpen(false);
        }
    };

    const handleAddTask = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && selectedEventId && e.currentTarget.value.trim()) {
            const originalId = (selectedEvent?.extendedProps as ScheduleEvent)?.id || selectedEventId;
            const eventId = parseInt(originalId.split('-')[0], 10);
            
            const request: EventTaskCreateRequest = {
                title: e.currentTarget.value.trim(),
                statusId: statusMap['TODO'],
                assigneeId: currentUser?.id,
                dueDatetime: null
            };
            addTask(eventId, request);
            e.currentTarget.value = '';
        }
    };

    const handleToggleTask = (taskId: number) => {
        const taskToUpdate = tasks.find(t => t.id === taskId);
        if (!taskToUpdate) return;
        const statusCycle: { [key in EventTask['status']]: EventTask['status'] } = { 'TODO': 'DOING', 'DOING': 'DONE', 'DONE': 'TODO' };
        updateTask(taskId, { statusId: statusMap[statusCycle[taskToUpdate.status]] });
    };
    
    const handleNav = (action: 'prev' | 'next' | 'today') => {
        calendarRef.current?.getApi()[action]();
        if (action === 'today') {
            setAgendaDate(new Date());
        }
    };
    
    useEffect(() => {
        if (calendarRef.current) {
            setCurrentTitle(calendarRef.current.getApi().view.title);
        }
    }, []);

    useEffect(() => {
        if (todaysEvents.length > 0 && !todaysEvents.some(e => e.id === selectedEventId)) {
            setSelectedEventId(todaysEvents[0].id!);
        } else if (todaysEvents.length === 0) {
            setSelectedEventId(null);
        }
    }, [todaysEvents, selectedEventId]);

    // --- 렌더링 함수 ---

    const renderEventContent = (eventInfo: EventContentArg) => {
        const props = eventInfo.event.extendedProps as ScheduleEvent;
        const ownerIcon = props.ownerType === 'USER' ? faUser : faLayerGroup;

        return (
            <div
                className={`${styles.eventContent} ${eventInfo.event.allDay ? styles.allDayStyle : styles.timedStyle}`}
                style={{ '--event-theme-color': props.color } as React.CSSProperties}
            >
                <FontAwesomeIcon icon={ownerIcon} className={styles.eventIcon} />
                <span className={styles.eventTitle}>{eventInfo.event.title}</span>
            </div>
        );
    };
    
    const TaskStatusIcon = ({ status }: { status: EventTask['status'] }) => {
        switch (status) {
            case 'TODO': return <FontAwesomeIcon icon={faCircle} title="할 일" />;
            case 'DOING': return <FontAwesomeIcon icon={faCircleHalfStroke} title="진행중" />;
            case 'DONE': return <FontAwesomeIcon icon={faCircleCheck} title="완료" />;
            default: return null;
        }
    };

    if (isLoading) {
        return <div className={styles.pageContainer}><h1>로딩 중...</h1></div>;
    }

    return (
        <>
            <div className={styles.pageContainer}>
                <div className={styles.leftColumn}>
                    <div className={`${styles.panel} ${styles.calendarWrapper}`}>
                        <div className={styles.calendarHeader}>
                            <div className={styles.headerControls}>
                                <button onClick={() => handleNav('prev')} className={styles.navButton} title="이전 달"><FontAwesomeIcon icon={faChevronLeft} /></button>
                                <span className={styles.headerTitle}>{currentTitle}</span>
                                <button onClick={() => handleNav('next')} className={styles.navButton} title="다음 달"><FontAwesomeIcon icon={faChevronRight} /></button>
                            </div>
                            <button onClick={() => handleNav('today')} className={styles.todayButton}>Today</button>
                        </div>
                        <div className={styles.calendarContent}>
                            <FullCalendar
                                ref={calendarRef}
                                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                                initialView="dayGridMonth"
                                headerToolbar={false}
                                dayMaxEvents={2}
                                events={processedEvents}
                                editable={false}
                                selectable={true}
                                eventClick={handleEventClick}
                                dateClick={handleDateClick}
                                datesSet={(arg) => {
                                    setCurrentTitle(arg.view.title);
                                    setViewRange({ start: arg.view.activeStart, end: arg.view.activeEnd });
                                }}
                                locale={'ko'}
                                eventContent={renderEventContent}
                            />
                        </div>
                    </div>
                    <UniversityTimetable />
                </div>

                <div className={styles.rightColumn} key={dayjs(agendaDate).format('YYYYMMDD')}>
                    <div className={`${styles.panel} ${styles.agendaContainer} ${styles.animatedCard}`}>
                        <div className={styles.panelHeader}>
                            <h3><FontAwesomeIcon icon={faCalendarDays} /> Today's Agenda</h3>
                            <span className={styles.date}>{dayjs(agendaDate).format('MM월 DD일 dddd')}</span>
                        </div>
                        <div className={styles.scrollableContent}>
                            {todaysEvents.length > 0 ? (
                                <ul className={styles.agendaList}>
                                    {todaysEvents.map(event => {
                                        const eventProps = event.extendedProps as ScheduleEvent;
                                        return (
                                            <li
                                                key={event.id}
                                                className={`${styles.agendaItem} ${selectedEventId === event.id ? styles.selected : ''}`}
                                                onClick={() => setSelectedEventId(event.id!)}
                                                style={{ '--event-color': eventProps.color } as React.CSSProperties}
                                            >
                                                <div className={styles.agendaLeft}>
                                                    <div className={styles.ownerIcon} style={{ backgroundColor: eventProps.color }}>
                                                        <FontAwesomeIcon icon={eventProps.ownerType === 'USER' ? faUser : faLayerGroup} />
                                                    </div>
                                                    <div className={styles.agendaInfo}>
                                                        <span className={styles.agendaTitle}>{event.title}</span>
                                                        <span className={styles.agendaTime}>
                                                            {event.allDay ? '하루 종일' : `${dayjs(event.start as string).format('HH:mm')} - ${dayjs(event.end as string).format('HH:mm')}`}
                                                        </span>
                                                    </div>
                                                </div>
                                            </li>
                                        );
                                    })}
                                </ul>
                            ) : (<div className={styles.noItems}>오늘 등록된 일정이 없습니다.</div>)}
                        </div>
                    </div>
                    <div className={`${styles.panel} ${styles.todoContainer} ${styles.animatedCard}`} style={{ animationDelay: '0.1s' }}>
                        <div className={styles.panelHeader}>
                            <h3>To-Do List</h3>
                            <span className={styles.todoHeaderSubtitle}>{selectedEvent?.title || '일정 선택 필요'}</span>
                        </div>
                        <div className={styles.scrollableContent}>
                            {selectedEventId ? (
                                (selectedEvent?.extendedProps as ScheduleEvent)?.isEditable ? (
                                    <ul className={styles.todoList}>
                                        {selectedEventTasks.length > 0 ? selectedEventTasks.map(task => (
                                            <li key={task.id} className={`${styles.todoItem} ${styles[task.status.toLowerCase()]}`}>
                                                <button className={styles.todoStatusButton} onClick={() => handleToggleTask(task.id)}>
                                                    <TaskStatusIcon status={task.status} />
                                                </button>
                                                <span className={styles.todoTitle} title={task.title}>{task.title}</span>
                                            </li>
                                        )) : <div className={styles.noItems}>할 일이 없습니다.<br />새로운 할 일을 추가해보세요.</div>}
                                    </ul>
                                ) : (
                                    <div className={styles.noItems}>읽기 전용 일정입니다.</div>
                                )
                            ) : (<div className={styles.noItems}>일정을 선택하여<br />할 일을 확인하세요.</div>)}
                        </div>
                        {selectedEvent && (selectedEvent.extendedProps as ScheduleEvent).isEditable && (
                            <div className={styles.addTodoWrapper}>
                                <FontAwesomeIcon icon={faPlus} className={styles.addTodoIcon} />
                                <input type="text" placeholder="새로운 할 일 추가 (Enter)" className={styles.addTodoInput} onKeyDown={handleAddTask} />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {isModalOpen && <EventEditorModal
                event={editingEvent}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveEvent}
                onDelete={handleDeleteEvent}
                onEventUpdate={fetchEvents}
            />}
        </>
    );
};

export default SchedulePage;