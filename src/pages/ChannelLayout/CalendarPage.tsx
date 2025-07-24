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
import { faPlus, faLayerGroup, faCalendarDays, faChevronLeft, faChevronRight, faCircle, faCircleHalfStroke, faCircleCheck } from '@fortawesome/free-solid-svg-icons';
import 'dayjs/locale/ko';
import toast from 'react-hot-toast';

import schedulePageStyles from '../AppLayout/SchedulePage/SchedulePage.module.css';
import type { ScheduleEvent, EventTask, EventParticipant, UpdateTaskRequest, EventTaskCreateRequest } from '../../types';
import EventEditorModal from '../AppLayout/SchedulePage/EventEditorModal/EventEditorModal';

import { getGroupEvents, createGroupEvent, updateGroupEvent, deleteGroupEvent, transformToScheduleEvent, createTaskForEvent } from '../../api/events';
import { getGroupDetail } from '../../api/groups';
import { updateTask } from '../../api/tasks';


dayjs.extend(isBetween);
dayjs.locale('ko');

const CURRENT_USER_ID = 1;

const getEventInstanceId = (event: ScheduleEvent, date: Date | string): string => {
    if (!event.rrule) return event.id;
    return `${event.id}-${dayjs(date).format('YYYYMMDD')}`;
};

const CalendarPage: React.FC = () => {
    const { groupId } = useParams<{ groupId: string }>();
    const calendarRef = useRef<FullCalendar>(null);
    const clickTimeout = useRef<number | null>(null);

    const [currentTitle, setCurrentTitle] = useState('');
    const [events, setEvents] = useState<ScheduleEvent[]>([]);
    const [tasks, setTasks] = useState<EventTask[]>([]);
    const [groupName, setGroupName] = useState('');
    const [groupParticipants, setGroupParticipants] = useState<EventParticipant[]>([]);
    const [agendaDate, setAgendaDate] = useState(new Date());
    const [viewRange, setViewRange] = useState({ start: new Date(), end: new Date() });
    const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEvent, setEditingEvent] = useState<ScheduleEvent | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchData = useCallback(async (eventIdToUpdate?: string) => {
        if (!groupId) return;
        setIsLoading(true);
        try {
            const numericGroupId = parseInt(groupId, 10);
            const [groupDetailRes, eventsRes] = await Promise.all([
                getGroupDetail(numericGroupId),

                getGroupEvents(numericGroupId)
            ]);
            const groupDetail = groupDetailRes.data;
            setGroupName(groupDetail.name);
            const participants = groupDetail.members.map(m => ({ userId: m.userId, userName: m.userName, status: 'TENTATIVE' as const }));
            setGroupParticipants(participants);

            const allTasks: EventTask[] = [];
            const groupForTransform = [{ id: numericGroupId, name: groupDetail.name, code: '', themeColor: '' }];
            const transformedEvents = eventsRes.map(event => {
                const scheduleEvent = transformToScheduleEvent(event, groupForTransform);
                scheduleEvent.isEditable = true;
                scheduleEvent.createdBy = event.createdBy;
                if (scheduleEvent.tasks) {
                    allTasks.push(...scheduleEvent.tasks);
                }
                return scheduleEvent;
            });
            setEvents(transformedEvents);
            setTasks(allTasks);

            if (eventIdToUpdate) {
                const updatedEvent = transformedEvents.find(e => e.id === eventIdToUpdate);
                if (updatedEvent) {
                    setEditingEvent(updatedEvent);
                }
            }

        } catch (error) {
            toast.error("그룹 일정 정보를 불러오는 데 실패했습니다.");
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    }, [groupId]);

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
                classNames: [schedulePageStyles.calendarEvent],
                backgroundColor: 'transparent',
                borderColor: 'transparent',
                textColor: '#E0E0E0',
                extendedProps: { ...event, isEditable: true }
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
        const color = props.color || '#888';
        return (
            <div className={`${schedulePageStyles.eventContent} ${eventInfo.event.allDay ? schedulePageStyles.allDayStyle : schedulePageStyles.timedStyle}`} style={{ '--event-theme-color': color } as React.CSSProperties}>
                <FontAwesomeIcon icon={faLayerGroup} className={schedulePageStyles.eventIcon} />
                <span className={schedulePageStyles.eventTitle}>{eventInfo.event.title}</span>
            </div>
        );
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
                ownerType: 'GROUP',
                ownerId: parseInt(groupId || '0', 10),
                groupName: groupName,
                tasks: [],
                participants: groupParticipants,
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
        if (!groupId) return;
        const numericGroupId = parseInt(groupId, 10);
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
                themeColor: eventData.color
            };

            const promise = (async () => {
                const eventResponse = await createGroupEvent(numericGroupId, requestData);
                const newEventId = eventResponse.data.eventId;

                if (eventData.tasks && eventData.tasks.length > 0) {
                    const taskPromises = eventData.tasks.map(task => {
                        const taskData: EventTaskCreateRequest = {
                            title: task.title,
                            statusId: statusMap[task.status],
                            assigneeId: undefined,
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
            const promises = [];

            const requestData = {
                title: eventData.title, description: eventData.description, location: eventData.location,
                startDatetime: dayjs(eventData.start).format('YYYY-MM-DDTHH:mm:ss'),
                endDatetime: eventData.end ? dayjs(eventData.end).format('YYYY-MM-DDTHH:mm:ss') : dayjs(eventData.start).format('YYYY-MM-DDTHH:mm:ss'),
                allDay: eventData.allDay, rrule: eventData.rrule, themeColor: eventData.color
            };
            promises.push(updateGroupEvent(numericGroupId, eventId, requestData));

            const newTasks = eventData.tasks?.filter(t => t.id > 1000000000000) || [];
            if (newTasks.length > 0) {
                const taskCreationPromises = newTasks.map(task => {
                    const taskData: EventTaskCreateRequest = {
                        title: task.title, statusId: statusMap[task.status], assigneeId: undefined,
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
        if (ownerType !== 'GROUP') return;
        const numericEventId = parseInt(eventId);

        const promise = deleteGroupEvent(ownerId, numericEventId);

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
            .sort((a, b) => dayjs(a.start as string).valueOf() - dayjs(b.start as string).valueOf()),
        [processedEvents, agendaDate]
    );

    const selectedEvent = useMemo(() => processedEvents.find(e => e.id === selectedEventId), [processedEvents, selectedEventId]);

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
        if (action === 'today') setAgendaDate(new Date());
    };

    const TaskStatusIcon = ({ status }: { status: EventTask['status'] }) => {
        const iconMap = { 'TODO': faCircle, 'DOING': faCircleHalfStroke, 'DONE': faCircleCheck };
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
                                    {todaysEvents.map(event => (
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
                                    {selectedEventTasks.length > 0 ? selectedEventTasks.map(task => (
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
            {isModalOpen && <EventEditorModal
                event={editingEvent}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveEvent}
                onDelete={handleDeleteEvent}
                onDataRefresh={() => fetchData(editingEvent?.id)}
            />}
        </>
    );
};

export default CalendarPage;