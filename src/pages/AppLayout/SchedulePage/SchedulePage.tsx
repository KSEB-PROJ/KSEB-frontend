/**
 * @file SchedulePage.tsx
 * @description 개인 스케줄과 대학 시간표를 통합하여 보여주는 메인 스케줄 관리 페이지입니다.
 * - FullCalendar 라이브러리를 사용하여 전체 일정을 시각적으로 표시합니다.
 * - Zustand의 `useEventStore`를 통해 모든 일정 데이터를 관리합니다.
 * - 오늘의 안건(Agenda)과 선택된 일정의 할 일(To-Do) 목록을 우측에 표시합니다.
 * - 사용자는 이 페이지에서 새 일정을 추가하거나 기존 일정을 수정/삭제할 수 있습니다.
 */

import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import FullCalendar from '@fullcalendar/react';
import type { EventClickArg, EventInput, EventContentArg, MoreLinkArg, EventApi } from '@fullcalendar/core';
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
import type { ScheduleEvent, EventTask } from '../../../types';
import EventEditorModal from './EventEditorModal/EventEditorModal';
import UniversityTimetable from './UniversityTimetable/UniversityTimetable';

// Zustand 스토어 import
import { useEventStore } from '../../../stores/eventStore';
import { useAuthStore } from '../../../stores/authStore';

dayjs.extend(isBetween);
dayjs.locale('ko');

// 할 일 상태 ID 맵
const statusMap: { [key in EventTask['status']]: number } = { 'TODO': 1, 'DOING': 2, 'DONE': 3 };

const formatColorForCSS = (colorString?: string): string => {
    if (!colorString) return '#3788d8';
    if (colorString.startsWith('#')) return colorString;
    if (colorString.includes(',')) return `rgb(${colorString})`;
    return colorString;
};

const getEventInstanceId = (event: ScheduleEvent, date: Date | string): string => {
    if (!event.rrule) return event.id;
    return `${event.id}-${dayjs(date).format('YYYYMMDD')}`;
};

const SchedulePage: React.FC = () => {
    const calendarRef = useRef<FullCalendar>(null);
    const clickTimeout = useRef<number | null>(null);

    const { events, tasks, isLoading, fetchEvents, saveEvent, deleteEvent, updateTask, addTask } = useEventStore();
    const { user: currentUser } = useAuthStore();

    const [currentTitle, setCurrentTitle] = useState('');
    const [viewType, setViewType] = useState('dayGridMonth');
    const [expandedDate, setExpandedDate] = useState<string | null>(null);
    const [agendaDate, setAgendaDate] = useState(new Date());
    const [viewRange, setViewRange] = useState({ start: new Date(), end: new Date() });
    const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEvent, setEditingEvent] = useState<ScheduleEvent | null>(null);

    useEffect(() => {
        fetchEvents();
    }, [fetchEvents]);

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

    const renderEventContent = (eventInfo: EventContentArg) => {
        const props = eventInfo.event.extendedProps as ScheduleEvent;
        const color = formatColorForCSS(props.color);
        const ownerIcon = props.ownerType === 'USER' ? faUser : faLayerGroup;

        return (
            <div
                className={`${styles.eventContent} ${eventInfo.event.allDay ? styles.allDayStyle : styles.timedStyle}`}
                style={{ '--event-theme-color': color } as React.CSSProperties}
            >
                <FontAwesomeIcon icon={ownerIcon} className={styles.eventIcon} />
                <span className={styles.eventTitle}>{eventInfo.event.title}</span>
            </div>
        );
    };

    const handleMoreLinkClick = (arg: MoreLinkArg) => {
        const dateStr = dayjs(arg.date).format('YYYY-MM-DD');
        setExpandedDate(prev => (prev === dateStr ? null : dateStr));
    };

    const handleDateClick = (arg: DateClickArg) => {
        if (!currentUser) return;

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
                ownerType: 'USER',
                ownerId: currentUser.id,
                tasks: [],
                participants: [{ userId: currentUser.id, userName: currentUser.name, status: 'ACCEPTED' }],
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
        if (success) {
            setIsModalOpen(false);
        }
    };

    /**
     * @description 이벤트 편집 모달에서 '삭제' 버튼을 눌렀을 때 실행됩니다.
     * - ✅ 수정: 이제 eventId만 인자로 받습니다.
     */
    const handleDeleteEvent = async (eventId: string) => {
        const originalEventId = eventId.split('-')[0];
        const eventToDelete = events.find(e => e.id === originalEventId);
        if (eventToDelete) {
            await deleteEvent(eventToDelete);
            setIsModalOpen(false);
        }
    };

    const handleEventUpdate = () => {
        fetchEvents();
    };

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

    const selectedEvent = useMemo(() =>
        processedEvents.find(e => e.id === selectedEventId),
        [processedEvents, selectedEventId]
    );
    
    const selectedEventTasks = useMemo(() => {
        if (!selectedEventId) return [];
        const originalId = (selectedEvent?.extendedProps as ScheduleEvent)?.id || selectedEventId;
        const eventIdToMatch = originalId.split('-')[0];
        return tasks.filter(t => t.eventId === eventIdToMatch);
    }, [tasks, selectedEventId, selectedEvent]);
    
    const handleToggleTask = (taskId: number) => {
        const taskToUpdate = tasks.find(t => t.id === taskId);
        if (!taskToUpdate) return;
        const statusCycle: { [key in EventTask['status']]: EventTask['status'] } = { 'TODO': 'DOING', 'DOING': 'DONE', 'DONE': 'TODO' };
        const nextStatus = statusCycle[taskToUpdate.status];
        updateTask(taskId, { statusId: statusMap[nextStatus] });
    };

    const handleAddTask = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && selectedEventId && e.currentTarget.value.trim()) {
            const originalId = (selectedEvent?.extendedProps as ScheduleEvent)?.id || selectedEventId;
            const eventIdToMatch = parseInt(originalId.split('-')[0], 10);
            const newTaskData: Omit<EventTask, 'id' | 'eventId'> = { 
                title: e.currentTarget.value.trim(), 
                status: 'TODO', 
                dueDate: null 
            };
            addTask(eventIdToMatch, newTaskData); 
            e.currentTarget.value = '';
        }
    };
    
    useEffect(() => {
        if (todaysEvents.length > 0 && !todaysEvents.some(e => e.id === selectedEventId)) {
            setSelectedEventId(todaysEvents[0].id!);
        } else if (todaysEvents.length === 0) {
            setSelectedEventId(null);
        }
    }, [todaysEvents, selectedEventId]);

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
                                initialView={viewType}
                                headerToolbar={false}
                                dayMaxEvents={2}
                                moreLinkClick={handleMoreLinkClick}
                                events={processedEvents}
                                editable={false}
                                selectable={true}
                                eventClick={handleEventClick}
                                dateClick={handleDateClick}
                                dayCellClassNames={(arg) => {
                                    if (dayjs(arg.date).format('YYYY-MM-DD') === expandedDate) {
                                        return [styles.dayExpanded];
                                    }
                                    return [];
                                }}
                                datesSet={(arg) => {
                                    setCurrentTitle(arg.view.title);
                                    setViewRange({ start: arg.view.activeStart, end: arg.view.activeEnd });
                                    setViewType(arg.view.type);
                                    if (expandedDate && !dayjs(expandedDate).isBetween(arg.view.activeStart, arg.view.activeEnd, null, '[]')) {
                                        setExpandedDate(null);
                                    }
                                }}
                                locale={'ko'}
                                eventContent={renderEventContent}
                            />
                        </div>
                    </div>
                    <UniversityTimetable onTimetableUpdate={fetchEvents} />
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
                                        const eventColor = formatColorForCSS((event.extendedProps as ScheduleEvent).color);
                                        return (
                                            <li
                                                key={event.id}
                                                className={`${styles.agendaItem} ${selectedEventId === event.id ? styles.selected : ''}`}
                                                onClick={() => setSelectedEventId(event.id!)}
                                                style={{ '--event-color': eventColor } as React.CSSProperties}
                                            >
                                                <div className={styles.agendaLeft}>
                                                    <div className={styles.ownerIcon} style={{ backgroundColor: eventColor }}>
                                                        <FontAwesomeIcon icon={(event.extendedProps as ScheduleEvent).ownerType === 'USER' ? faUser : faLayerGroup} />
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
                onEventUpdate={handleEventUpdate}
            />}
        </>
    );
};

export default SchedulePage;