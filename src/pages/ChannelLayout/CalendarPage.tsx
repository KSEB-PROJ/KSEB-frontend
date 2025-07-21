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

import schedulePageStyles from '../AppLayout/SchedulePage/SchedulePage.module.css';
import type { ScheduleEvent, EventTask, EventParticipant } from '../AppLayout/SchedulePage/types';
import EventEditorModal from '../AppLayout/SchedulePage/EventEditorModal/EventEditorModal';

dayjs.extend(isBetween);
dayjs.locale('ko');

// --- Mock Data ---
const CURRENT_USER_ID = 123;
const CURRENT_USER_NAME = '김세현';

const mockParticipants: EventParticipant[] = [
    { userId: CURRENT_USER_ID, userName: CURRENT_USER_NAME, status: 'ACCEPTED' },
    { userId: 456, userName: '박서연', status: 'ACCEPTED' },
    { userId: 789, userName: '이대은', status: 'TENTATIVE' },
    { userId: 101, userName: '최민준', status: 'DECLINED' },
];

const allMockGroupEvents: ScheduleEvent[] = [
    { id: 'event-group-1', title: '캡스톤 디자인 정기 회의', start: '2025-07-18T14:00:00', end: '2025-07-18T16:00:00', allDay: false, location: '공학관 611호', ownerType: 'GROUP', ownerId: 1, groupName: 'Bloom Us 개발팀', color: '#8400ff', rrule: 'FREQ=WEEKLY;BYDAY=FR;UNTIL=20250829T235959Z', participants: mockParticipants, createdBy: 456 },
    { id: 'event-group-2', title: 'Bloom Us 팀 회고', start: dayjs('2025-07-25').format('YYYY-MM-DD'), allDay: true, ownerType: 'GROUP', ownerId: 1, groupName: 'Bloom Us 개발팀', color: '#e5096f', participants: mockParticipants, createdBy: CURRENT_USER_ID },
    { id: 'event-group-3', title: 'UI/UX 리뷰', start: dayjs('2025-07-22').hour(14).toISOString(), end: dayjs('2025-07-22').hour(15).toISOString(), allDay: false, ownerType: 'GROUP', ownerId: 1, groupName: 'Bloom Us 개발팀', color: '#f97316', createdBy: 456 },
    { id: 'event-group-4', title: '백엔드 API 설계', start: dayjs('2025-07-23').hour(16).toISOString(), end: dayjs('2025-07-23').hour(17).toISOString(), allDay: false, ownerType: 'GROUP', ownerId: 1, groupName: 'Bloom Us 개발팀', color: '#ef4444', createdBy: 456 },
    { id: 'event-group-5', title: '타 그룹 회의', start: dayjs('2025-07-24').hour(11).toISOString(), end: dayjs('2025-07-24').hour(12).toISOString(), allDay: false, ownerType: 'GROUP', ownerId: 2, groupName: '다른 프로젝트 팀', color: '#22c55e', participants: mockParticipants.slice(0, 2), createdBy: 789 },
];

const mockTasks: EventTask[] = [
    { id: 1, eventId: 'event-group-1-20250718', title: '발표 PPT 초안 완성', status: 'TODO', dueDate: null },
    { id: 2, eventId: 'event-group-1-20250718', title: '시연 시나리오 구체화', status: 'DOING', dueDate: null },
    { id: 3, eventId: 'event-group-2', title: '회고록 작성 및 공유', status: 'DONE', dueDate: dayjs().add(1, 'week').endOf('day').toISOString() },
];

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
    const [tasks, setTasks] = useState<EventTask[]>(mockTasks);
    const [agendaDate, setAgendaDate] = useState(new Date());
    const [viewRange, setViewRange] = useState({ start: new Date(), end: new Date() });
    const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEvent, setEditingEvent] = useState<ScheduleEvent | null>(null);

    useEffect(() => {
        if (groupId) {
            const numericGroupId = parseInt(groupId, 10);
            const filteredEvents = allMockGroupEvents.filter(e => e.ownerId === numericGroupId);
            setEvents(filteredEvents);
        }
    }, [groupId]);

    // 👇 [수정] 데이터가 누락되지 않도록 로직을 단순화하고 FullCalendar에 처리를 위임합니다.
    const processedEvents = useMemo((): EventInput[] => {
        const viewStart = dayjs(viewRange.start).startOf('day').toDate();
        const viewEnd = dayjs(viewRange.end).endOf('day').toDate();

        return events.flatMap(event => {
            const isEditable = true;
            const eventStyleOptions: EventInput = {
                ...event,
                display: 'block',
                classNames: [schedulePageStyles.calendarEvent],
                backgroundColor: 'transparent',
                borderColor: 'transparent',
                textColor: '#E0E0E0',
                extendedProps: { ...event, isEditable }
            };

            if (event.rrule && event.end) {
                try {
                    const rule = new RRule({ ...RRule.parseString(event.rrule), dtstart: dayjs(event.start).toDate() });
                    const duration = dayjs(event.end).diff(dayjs(event.start));

                    return rule.between(viewStart, viewEnd).map(date => ({
                        ...eventStyleOptions,
                        id: getEventInstanceId(event, date),
                        start: date,
                        end: dayjs(date).add(duration, 'ms').toDate()
                    }));
                } catch (e) {
                    console.error("Error parsing rrule:", e);
                    return [];
                }
            } else {
                return [eventStyleOptions];
            }
        });
    }, [events, viewRange.start, viewRange.end]);


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
            setEditingEvent({
                id: `temp-${Date.now()}`,
                title: '',
                start: arg.dateStr,
                end: arg.allDay ? dayjs(arg.dateStr).add(1, 'day').format('YYYY-MM-DD') : dayjs(arg.dateStr).add(1, 'hour').toISOString(),
                allDay: arg.allDay,
                ownerType: 'GROUP',
                ownerId: parseInt(groupId || '0', 10),
                groupName: events.find(e => e.ownerId === parseInt(groupId || '0', 10))?.groupName || 'Current Group',
                tasks: [],
                participants: mockParticipants,
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
        const originalEventId = props.id.startsWith('event-') ? props.id.split('-').slice(0, 3).join('-') : props.id;
        const originalEvent = events.find(e => e.id === originalEventId);
        if (!originalEvent) return;

        setEditingEvent({
            ...originalEvent,
            id: event.id as string,
            start: dayjs(event.start as string).toISOString(),
            end: event.end ? dayjs(event.end as string).toISOString() : dayjs(event.start as string).add(1, 'hour').toISOString(),
            tasks: tasks.filter(t => t.eventId === event.id || t.eventId === originalEventId),
            isEditable: true,
        });
        setIsModalOpen(true);
        setSelectedEventId(event.id as string);
    }, [events, tasks]);

    const handleEventClick = useCallback((arg: EventClickArg) => {
        openEditorForEvent(arg.event);
    }, [openEditorForEvent]);

    const handleSaveEvent = (eventData: ScheduleEvent) => {
        const originalId = eventData.id.startsWith('event-') ? eventData.id.split('-').slice(0, 3).join('-') : eventData.id;
        const isNew = String(eventData.id).startsWith('temp-');
        const finalEventData = {
            ...eventData,
            id: isNew ? `event-group-${Date.now()}` : originalId,
        };
        setEvents(prev => isNew ? [...prev, finalEventData] : prev.map(e => e.id === originalId ? { ...e, ...finalEventData, id: originalId } : e));
        setTasks(prevTasks => {
            const otherTasks = prevTasks.filter(t => !t.eventId.startsWith(originalId));
            const updatedTasks = (finalEventData.tasks || []).map(task => ({ ...task, id: task.id > 1000000 ? task.id : Date.now() + Math.random(), eventId: finalEventData.id }));
            return [...otherTasks, ...updatedTasks];
        });
        setIsModalOpen(false);
    };

    const handleDeleteEvent = (eventId: string) => {
        const originalId = eventId.split('-')[0] === 'event' ? eventId.split('-').slice(0, 3).join('-') : eventId;
        setEvents(prev => prev.filter(e => e.id !== originalId));
        setTasks(prev => prev.filter(t => !t.eventId.startsWith(originalId)));
        setIsModalOpen(false);
        if (selectedEventId?.startsWith(originalId)) setSelectedEventId(null);
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
        return tasks.filter(t => t.eventId === selectedEventId || t.eventId === originalId.split('-').slice(0, 3).join('-'));
    }, [tasks, selectedEventId, selectedEvent]);

    const handleToggleTask = (taskId: number) => {
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: t.status === 'TODO' ? 'DOING' : t.status === 'DOING' ? 'DONE' : 'TODO' } : t));
    };

    const handleAddTask = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && selectedEventId && e.currentTarget.value.trim()) {
            const originalId = (selectedEvent?.extendedProps as ScheduleEvent)?.id || selectedEventId;
            const newTask: EventTask = { id: Date.now(), eventId: originalId.split('-').slice(0, 3).join('-'), title: e.currentTarget.value.trim(), status: 'TODO', dueDate: null };
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

    useEffect(() => {
        const api = calendarRef.current?.getApi();
        if (api) {
            setCurrentTitle(api.view.title);
            // FullCalendar가 준비되면 초기 날짜를 2025년 7월로 설정
            api.gotoDate('2025-07-01');
        }
    }, []);


    const TaskStatusIcon = ({ status }: { status: EventTask['status'] }) => {
        const iconMap = { 'TODO': faCircle, 'DOING': faCircleHalfStroke, 'DONE': faCircleCheck };
        return <FontAwesomeIcon icon={iconMap[status]} title={status} />;
    };

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
            {isModalOpen && <EventEditorModal event={editingEvent} onClose={() => setIsModalOpen(false)} onSave={handleSaveEvent} onDelete={handleDeleteEvent} />}
        </>
    );
};

export default CalendarPage;