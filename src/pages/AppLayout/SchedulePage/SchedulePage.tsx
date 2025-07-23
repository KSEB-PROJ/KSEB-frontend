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
import toast from 'react-hot-toast';

import styles from './SchedulePage.module.css';
import type { ScheduleEvent, EventTask, UpdateTaskRequest, EventTaskCreateRequest } from '../../../types';
import EventEditorModal from './EventEditorModal/EventEditorModal';
import UniversityTimetable from './UniversityTimetable/UniversityTimetable';

import { getMyEvents, createPersonalEvent, updatePersonalEvent, deletePersonalEvent, createGroupEvent, updateGroupEvent, deleteGroupEvent, transformToScheduleEvent, createTaskForEvent, updateParticipantStatus } from '../../../api/events';
import { getMyGroups } from '../../../api/groups';
import { updateTask } from '../../../api/tasks';


dayjs.extend(isBetween);
dayjs.locale('ko');

const CURRENT_USER_ID = 1;

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
    const [currentTitle, setCurrentTitle] = useState('');
    const [viewType, setViewType] = useState('dayGridMonth');
    const [expandedDate, setExpandedDate] = useState<string | null>(null);
    const [events, setEvents] = useState<ScheduleEvent[]>([]);
    const [tasks, setTasks] = useState<EventTask[]>([]);
    const [agendaDate, setAgendaDate] = useState(new Date());
    const [viewRange, setViewRange] = useState({ start: new Date(), end: new Date() });
    const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEvent, setEditingEvent] = useState<ScheduleEvent | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [groupsRes, eventsRes] = await Promise.all([
                getMyGroups(),
                getMyEvents()
            ]);
            const userGroups = groupsRes.data;

            const allTasks: EventTask[] = [];
            const transformedEvents = eventsRes.map(event => {
                const scheduleEvent = transformToScheduleEvent(event, userGroups);
                scheduleEvent.isEditable = event.ownerType === 'USER' || event.createdBy === CURRENT_USER_ID;
                scheduleEvent.createdBy = event.createdBy;
                if (scheduleEvent.tasks) {
                    allTasks.push(...scheduleEvent.tasks);
                }
                return scheduleEvent;
            });
            setEvents(transformedEvents);
            setTasks(allTasks);

        } catch (error) {
            toast.error("일정 정보를 불러오는 데 실패했습니다.");
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);


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
                ownerId: CURRENT_USER_ID,
                tasks: [],
                participants: [{ userId: CURRENT_USER_ID, userName: "Me", status: 'ACCEPTED' }],
                isEditable: true,
                createdBy: CURRENT_USER_ID
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

    const handleSaveEvent = (eventData: ScheduleEvent) => {
        const isNew = String(eventData.id).startsWith('temp-');
        const statusMap: { [key in EventTask['status']]: number } = { 'TODO': 1, 'DOING': 2, 'DONE': 3 };
    
        if (isNew) {
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
    
            const promise = (async () => {
                const createPromise = eventData.ownerType === 'USER'
                    ? createPersonalEvent(requestData)
                    : createGroupEvent(eventData.ownerId, requestData);
    
                const eventResponse = await createPromise;
                const newEventId = eventResponse.data.eventId;
    
                if (eventData.tasks && eventData.tasks.length > 0) {
                    const taskPromises = eventData.tasks.map(task => {
                        const taskData: EventTaskCreateRequest = {
                            title: task.title,
                            statusId: statusMap[task.status],
                            assigneeId: eventData.ownerType === 'USER' ? CURRENT_USER_ID : undefined,
                            dueDatetime: task.dueDate ? dayjs(task.dueDate).format('YYYY-MM-DDTHH:mm:ss') : null,
                        };
                        return createTaskForEvent(newEventId, taskData);
                    });
                    await Promise.all(taskPromises);
                }
            })();
    
            toast.promise(promise, {
                loading: '일정 생성 중...',
                success: () => {
                    setIsModalOpen(false);
                    fetchData();
                    return <b>성공적으로 저장되었습니다.</b>;
                },
                error: (err) => {
                    console.error(err);
                    return <b>저장에 실패했습니다.</b>;
                }
            });
        } else {
            const eventId = parseInt(eventData.id);
            const originalEvent = editingEvent;
            const promises = [];
    
            const requestData = {
                title: eventData.title, description: eventData.description, location: eventData.location,
                startDatetime: dayjs(eventData.start).format('YYYY-MM-DDTHH:mm:ss'),
                endDatetime: eventData.end ? dayjs(eventData.end).format('YYYY-MM-DDTHH:mm:ss') : dayjs(eventData.start).format('YYYY-MM-DDTHH:mm:ss'),
                allDay: eventData.allDay, rrule: eventData.rrule, themeColor: eventData.color
            };
            const eventUpdatePromise = eventData.ownerType === 'USER'
                ? updatePersonalEvent(eventId, requestData)
                : updateGroupEvent(eventData.ownerId, eventId, requestData);
            promises.push(eventUpdatePromise);
    
            const originalStatus = originalEvent?.participants?.find(p => p.userId === CURRENT_USER_ID)?.status;
            const newStatus = eventData.participants?.find(p => p.userId === CURRENT_USER_ID)?.status;
            if (originalStatus && newStatus && originalStatus !== newStatus && eventData.ownerType === 'GROUP') {
                promises.push(updateParticipantStatus(eventData.ownerId, eventId, { status: newStatus }));
            }
    
            const newTasks = eventData.tasks?.filter(t => t.id > 1000000000000) || [];
            if (newTasks.length > 0) {
                const taskCreationPromises = newTasks.map(task => {
                    const taskData: EventTaskCreateRequest = {
                        title: task.title, statusId: statusMap[task.status],
                        assigneeId: eventData.ownerType === 'USER' ? CURRENT_USER_ID : undefined,
                        dueDatetime: task.dueDate ? dayjs(task.dueDate).format('YYYY-MM-DDTHH:mm:ss') : null,
                    };
                    return createTaskForEvent(eventId, taskData);
                });
                promises.push(...taskCreationPromises);
            }
    
            toast.promise(Promise.all(promises), {
                loading: '일정 업데이트 중...',
                success: () => {
                    setIsModalOpen(false);
                    fetchData();
                    return <b>성공적으로 저장되었습니다.</b>;
                },
                error: <b>저장에 실패했습니다.</b>
            });
        }
    };

    const handleDeleteEvent = (eventId: string, ownerType: 'USER' | 'GROUP', ownerId: number) => {
        const numericEventId = parseInt(eventId);
        let promise;

        if (ownerType === 'USER') {
            promise = deletePersonalEvent(numericEventId);
        } else {
            promise = deleteGroupEvent(ownerId, numericEventId);
        }

        toast.promise(promise, {
            loading: '삭제 중...',
            success: () => {
                setIsModalOpen(false);
                setEvents(prev => prev.filter(e => e.id !== eventId));
                return <b>삭제되었습니다.</b>;
            },
            error: <b>삭제에 실패했습니다.</b>
        });
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
        const statusMap: { [key in EventTask['status']]: number } = { 'TODO': 1, 'DOING': 2, 'DONE': 3 };
        const taskToUpdate = tasks.find(t => t.id === taskId);
        if (!taskToUpdate) return;

        const statusCycle: { [key in EventTask['status']]: EventTask['status'] } = { 'TODO': 'DOING', 'DOING': 'DONE', 'DONE': 'TODO' };
        const nextStatus = statusCycle[taskToUpdate.status];
        const requestData: UpdateTaskRequest = { statusId: statusMap[nextStatus] };

        toast.promise(
            updateTask(taskId, requestData),
            {
                loading: '상태 변경 중...',
                success: () => {
                    const updateLogic = (prevTasks: EventTask[]) =>
                        prevTasks.map(t => t.id === taskId ? { ...t, status: nextStatus } : t);

                    setTasks(updateLogic);

                    setEvents(prevEvents => prevEvents.map(event => {
                        if (event.tasks && event.tasks.some(t => t.id === taskId)) {
                            return {
                                ...event,
                                tasks: event.tasks.map(t => t.id === taskId ? { ...t, status: nextStatus } : t)
                            };
                        }
                        return event;
                    }));

                    return <b>상태가 변경되었습니다.</b>;
                },
                error: <b>상태 변경에 실패했습니다.</b>,
            }
        );
    };

    const handleAddTask = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && selectedEventId && e.currentTarget.value.trim()) {
            const originalId = (selectedEvent?.extendedProps as ScheduleEvent)?.id || selectedEventId;
            const eventIdToMatch = originalId.split('-')[0];
            const newTask: EventTask = { id: Date.now(), eventId: eventIdToMatch, title: e.currentTarget.value.trim(), status: 'TODO', dueDate: null };
            setTasks(prev => [...prev, newTask]);
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
                    <UniversityTimetable onTimetableUpdate={fetchData} />
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
            />}

        </>
    );
};

export default SchedulePage;