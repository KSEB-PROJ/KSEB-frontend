// src/pages/SchedulePage/SchedulePage.tsx

import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import FullCalendar from '@fullcalendar/react';
import type { EventClickArg, EventInput, EventContentArg, MoreLinkArg, EventApi } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin, { type DateClickArg, type DropArg } from '@fullcalendar/interaction';
import { RRule } from 'rrule';
import dayjs from 'dayjs';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faCheck, faLayerGroup, faUser, faCalendarDays, faChevronLeft, faChevronRight, faTimes } from '@fortawesome/free-solid-svg-icons';
import 'dayjs/locale/ko';

import styles from './SchedulePage.module.css';
import type { ScheduleEvent, EventTask, EventParticipant } from './types';
import EventEditorModal from './EventEditorModal';
import UniversityTimetable from './UniversityTimetable';

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

const mockEvents: ScheduleEvent[] = [
    { id: 'event-user-1', title: '개인 프로젝트 기획', start: dayjs().add(1, 'day').hour(10).toISOString(), end: dayjs().add(1, 'day').hour(12).minute(30).toISOString(), allDay: false, location: '자택', ownerType: 'USER', ownerId: CURRENT_USER_ID, color: '#3b82f6', description: '개인 포트폴리오 프로젝트 기획.', participants: [{ userId: CURRENT_USER_ID, userName: CURRENT_USER_NAME, status: 'ACCEPTED' }], createdBy: CURRENT_USER_ID },
    { id: 'event-user-2', title: '알고리즘 스터디', start: dayjs().add(3, 'day').format('YYYY-MM-DD'), allDay: true, ownerType: 'USER', ownerId: CURRENT_USER_ID, color: '#17a88f', createdBy: CURRENT_USER_ID },
    { id: 'event-group-1', title: '캡스톤 디자인 정기 회의', start: '2025-07-18T14:00:00', end: '2025-07-18T16:00:00', allDay: false, location: '공학관 611호', ownerType: 'GROUP', ownerId: 1, groupName: 'Bloom Us 개발팀', color: '#8400ff', rrule: 'FREQ=WEEKLY;BYDAY=FR;UNTIL=20250829T235959Z', participants: mockParticipants, createdBy: 456 },
    { id: 'event-group-2', title: 'Bloom Us 팀 회고', start: dayjs().add(1, 'week').format('YYYY-MM-DD'), allDay: true, ownerType: 'GROUP', ownerId: 2, groupName: '캡스톤 디자인', color: '#e5096f', participants: mockParticipants, createdBy: CURRENT_USER_ID },
    // For overflow test
    { id: 'event-timed-3', title: 'UI/UX 리뷰', start: dayjs().add(1, 'day').hour(14).toISOString(), end: dayjs().add(1, 'day').hour(15).toISOString(), allDay: false, ownerType: 'GROUP', ownerId: 1, groupName: 'Bloom Us 개발팀', color: '#f97316', createdBy: 456 },
    { id: 'event-timed-4', title: '백엔드 API 설계', start: dayjs().add(1, 'day').hour(16).toISOString(), end: dayjs().add(1, 'day').hour(17).toISOString(), allDay: false, ownerType: 'GROUP', ownerId: 1, groupName: 'Bloom Us 개발팀', color: '#ef4444', createdBy: 456 },
    { id: 'event-user-3', title: '추가 테스트 이벤트 1', start: dayjs().add(3, 'day').format('YYYY-MM-DD'), allDay: true, ownerType: 'USER', ownerId: CURRENT_USER_ID, color: '#f97316', createdBy: CURRENT_USER_ID },
    { id: 'event-user-4', title: '추가 테스트 이벤트 2', start: dayjs().add(3, 'day').format('YYYY-MM-DD'), allDay: true, ownerType: 'USER', ownerId: CURRENT_USER_ID, color: '#ef4444', createdBy: CURRENT_USER_ID },
];

const mockTasks: EventTask[] = [
    { id: 1, eventId: 'event-user-1', title: '요구사항 정의서 작성', status: 'DONE', dueDate: '2025-07-16T11:00:00Z' },
    { id: 2, eventId: 'event-user-1', title: 'Figma 와이어프레임 제작', status: 'DOING', dueDate: '2025-07-16T18:00:00Z' },
    { id: 3, eventId: 'event-group-1-20250718', title: '발표 PPT 초안 완성', status: 'TODO', dueDate: null },
    { id: 4, eventId: 'event-group-1-20250718', title: '시연 시나리오 구체화', status: 'TODO', dueDate: null },
    { id: 5, eventId: 'event-user-2', title: 'DP 문제 3개 풀기', status: 'DOING', dueDate: null },
];

const getEventInstanceId = (event: ScheduleEvent, date: Date | string): string => {
    if (!event.rrule) return event.id;
    return `${event.id}-${dayjs(date).format('YYYYMMDD')}`;
};

interface MorePopoverData {
    anchorEl: HTMLElement;
    date: Date;
    events: EventApi[];
}

const SchedulePage: React.FC = () => {
    const calendarRef = useRef<FullCalendar>(null);
    const [currentTitle, setCurrentTitle] = useState('');
    const [viewType, setViewType] = useState('dayGridMonth');
    const [morePopover, setMorePopover] = useState<MorePopoverData | null>(null);
    const [popoverStyle, setPopoverStyle] = useState<React.CSSProperties>({});

    const [events, setEvents] = useState<ScheduleEvent[]>(mockEvents);
    const [tasks, setTasks] = useState<EventTask[]>(mockTasks);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [viewRange, setViewRange] = useState({ start: new Date(), end: new Date() });
    const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEvent, setEditingEvent] = useState<ScheduleEvent | null>(null);

    const processedEvents = useMemo((): EventInput[] => {
        const calendarEvents: EventInput[] = [];
        const viewStart = dayjs(viewRange.start).startOf('day');
        const viewEnd = dayjs(viewRange.end).endOf('day');

        events.forEach(event => {
            const isEditable = event.ownerType === 'USER' || (event.ownerType === 'GROUP' && event.createdBy === CURRENT_USER_ID);
            const eventStyleOptions = {
                ...event,
                display: 'block',
                classNames: [styles.calendarEvent, event.ownerType === 'GROUP' ? styles.groupEvent : styles.userEvent],
                backgroundColor: 'transparent',
                borderColor: 'transparent',
                textColor: '#E0E0E0',
                extendedProps: { ...event, isEditable }
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

    // 👈 [수정] 새로운 디자인을 적용하는 렌더링 함수
    const renderEventContent = (eventInfo: EventContentArg) => {
        const props = eventInfo.event.extendedProps as ScheduleEvent;
        const color = props.color || '#888';

        if (eventInfo.event.allDay) {
            return (
                <div className={styles.allDayEventContent}>
                    <span 
                        className={`${styles.eventDot} ${props.ownerType === 'GROUP' ? styles.groupEvent : ''}`} 
                        style={{ backgroundColor: color, borderColor: color }}
                    ></span>
                    {eventInfo.event.title}
                </div>
            );
        } else {
            return (
                <div 
                    className={`${styles.timedEventContent} ${props.ownerType === 'GROUP' ? styles.groupEvent : ''}`} 
                    style={{ borderLeftColor: color }}
                >
                    <div className={styles.eventTitle}>{eventInfo.event.title}</div>
                </div>
            );
        }
    };

    const handleDateClick = (arg: DateClickArg) => {
        setEditingEvent({
            id: `temp-${Date.now()}`,
            title: '',
            start: arg.dateStr,
            end: arg.allDay ? dayjs(arg.dateStr).add(1, 'day').format('YYYY-MM-DD') : dayjs(arg.dateStr).add(1, 'hour').toISOString(),
            allDay: arg.allDay,
            ownerType: 'USER',
            ownerId: CURRENT_USER_ID,
            tasks: [],
            participants: [{ userId: CURRENT_USER_ID, userName: CURRENT_USER_NAME, status: 'ACCEPTED' }],
            isEditable: true,
            createdBy: CURRENT_USER_ID
        });
        setIsModalOpen(true);
    };

    const openEditorForEvent = useCallback((event: EventApi) => {
        const props = event.extendedProps as ScheduleEvent;
        const originalEventId = props.id.startsWith('event-') ? props.id.split('-').slice(0, 3).join('-') : props.id;
        const originalEvent = events.find(e => e.id === originalEventId);

        if (!originalEvent) {
            console.error("Original event not found for ID:", originalEventId);
            return;
        }

        const instanceId = event.id;
        const isEditable = originalEvent.ownerType === 'USER' || (originalEvent.ownerType === 'GROUP' && originalEvent.createdBy === CURRENT_USER_ID);

        setEditingEvent({
            ...originalEvent,
            id: instanceId, 
            start: dayjs(event.start).toISOString(), 
            end: event.end ? dayjs(event.end).toISOString() : dayjs(event.start).add(1, 'hour').toISOString(), 
            tasks: tasks.filter(t => t.eventId === instanceId || t.eventId === originalEventId),
            isEditable,
        });
        setIsModalOpen(true);
        setSelectedEventId(instanceId);
    }, [events, tasks]);

    const handleEventClick = useCallback((arg: EventClickArg) => {
        openEditorForEvent(arg.event);
    }, [openEditorForEvent]);

    const handlePopoverEventClick = useCallback((event: EventApi) => {
        openEditorForEvent(event);
        setMorePopover(null); 
    }, [openEditorForEvent]);


    const handleSaveEvent = (eventData: ScheduleEvent) => {
        if (!eventData.isEditable) {
            alert("수정 권한이 없는 일정입니다.");
            return;
        }
        const originalId = eventData.id.startsWith('event-') ? eventData.id.split('-').slice(0, 3).join('-') : eventData.id;
        const isNew = String(eventData.id).startsWith('temp-');
        const finalEventData = { ...eventData, id: isNew ? `event-user-${Date.now()}` : originalId };
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
        const eventToDelete = events.find(e => e.id === originalId);
        if (!eventToDelete || !eventToDelete.isEditable) {
            alert("삭제 권한이 없는 일정입니다.");
            return;
        }
        setEvents(prev => prev.filter(e => e.id !== originalId));
        setTasks(prev => prev.filter(t => !t.eventId.startsWith(originalId)));
        setIsModalOpen(false);
        if (selectedEventId?.startsWith(originalId)) {
            setSelectedEventId(null);
        }
    };

    const handleMoreLinkClick = (arg: MoreLinkArg): 'prevent' => {
        const hiddenEvents = arg.allDay ? arg.allSegs.map(seg => seg.event) : arg.hiddenSegs.map(seg => seg.event);

        setMorePopover({
            anchorEl: arg.jsEvent.target as HTMLElement,
            date: arg.date,
            events: hiddenEvents
        });
        return 'prevent';
    };

    const todaysEvents = useMemo(() =>
        processedEvents
            .filter(e => dayjs(e.start as string).isSame(currentDate, 'day'))
            .sort((a, b) => {
                if ((a.allDay ?? false) && !(b.allDay ?? false)) return -1;
                if (!(a.allDay ?? false) && (b.allDay ?? false)) return 1;
                return dayjs(a.start as string).valueOf() - dayjs(b.start as string).valueOf()
            }),
        [processedEvents, currentDate]
    );

    const selectedEvent = useMemo(() =>
        processedEvents.find(e => e.id === selectedEventId),
        [processedEvents, selectedEventId]
    );

    const selectedEventTasks = useMemo(() => {
        if (!selectedEventId) return [];
        const originalId = (selectedEvent?.extendedProps as ScheduleEvent)?.id || selectedEventId;
        const eventIdToMatch = originalId.startsWith('event-') ? originalId.split('-').slice(0, 3).join('-') : originalId;
        return tasks.filter(t => t.eventId === selectedEventId || t.eventId === eventIdToMatch);
    }, [tasks, selectedEventId, selectedEvent]);

    const handleToggleTask = (taskId: number) => {
        setTasks(prev => prev.map(t => {
            if (t.id === taskId) {
                const nextStatus = { TODO: 'DOING', DOING: 'DONE', DONE: 'TODO' };
                return { ...t, status: nextStatus[t.status] as 'TODO' | 'DOING' | 'DONE' };
            }
            return t;
        }));
    };

    const handleAddTask = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && selectedEventId && e.currentTarget.value.trim()) {
            const originalId = (selectedEvent?.extendedProps as ScheduleEvent)?.id || selectedEventId;
            const eventIdToMatch = originalId.startsWith('event-') ? originalId.split('-').slice(0, 3).join('-') : originalId;
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
    };

    const changeView = (newView: 'dayGridMonth' | 'timeGridWeek') => {
        calendarRef.current?.getApi().changeView(newView);
        setViewType(newView);
    };

    useEffect(() => {
        if (calendarRef.current) {
            setCurrentTitle(calendarRef.current.getApi().view.title);
        }
    }, []);

    useEffect(() => {
        const closePopover = () => setMorePopover(null);

        if (morePopover) {
            const anchorRect = morePopover.anchorEl.getBoundingClientRect();
            const popoverHeight = 250;
            const popoverWidth = 280;

            let top = anchorRect.bottom + 5;
            let left = anchorRect.left;

            if (top + popoverHeight > window.innerHeight) {
                top = anchorRect.top - popoverHeight - 5;
            }
            if (left + popoverWidth > window.innerWidth) {
                left = anchorRect.right - popoverWidth;
            }

            setPopoverStyle({
                top: `${top}px`,
                left: `${left}px`,
                transformOrigin: top < anchorRect.top ? 'bottom left' : 'top left',
            });
            window.addEventListener('click', closePopover, { once: true, capture: true });
        }

        return () => window.removeEventListener('click', closePopover, true);
    }, [morePopover]);

    const handleDragStart = (e: React.DragEvent<HTMLLIElement>, event: EventApi) => {
        e.dataTransfer.setData('application/json', JSON.stringify(event.toPlainObject()));
    };

    const handleEventDropOnCalendar = (info: DropArg) => {
        const eventDataString = (info.jsEvent as DragEvent).dataTransfer?.getData('application/json');
        if (!eventDataString) return;

        try {
            const droppedEventObject = JSON.parse(eventDataString);
            const originalEventId = droppedEventObject.extendedProps.id.startsWith('event-')
                ? droppedEventObject.extendedProps.id.split('-').slice(0, 3).join('-')
                : droppedEventObject.extendedProps.id;

            const originalEvent = events.find(e => e.id === originalEventId);

            if (originalEvent) {
                const newStart = dayjs(info.date);
                const duration = dayjs(originalEvent.end).diff(dayjs(originalEvent.start));

                const updatedEvent: ScheduleEvent = {
                    ...originalEvent,
                    start: newStart.toISOString(),
                    end: newStart.add(duration, 'ms').toISOString()
                };

                setEvents(prev => prev.map(e => e.id === originalEvent.id ? updatedEvent : e));
            }
        } catch (error) {
            console.error("Failed to parse dropped event data:", error);
        } finally {
            setMorePopover(null); 
        }
    };


    return (
        <>
            <div className={styles.pageContainer}>
                <div className={styles.leftColumn}>
                    <div className={`${styles.panel} ${styles.calendarWrapper}`}>
                        <div className={styles.calendarHeader}>
                            <span className={styles.headerTitle}>{currentTitle}</span>
                            <div className={styles.floatingControls}>
                                <button onClick={() => handleNav('prev')} className={styles.navArrow} title="이전"><FontAwesomeIcon icon={faChevronLeft} /></button>
                                <button onClick={() => handleNav('next')} className={styles.navArrow} title="다음"><FontAwesomeIcon icon={faChevronRight} /></button>
                            </div>
                            <div className={styles.viewSwitcher}>
                                <button className={viewType === 'dayGridMonth' ? styles.active : ''} onClick={() => changeView('dayGridMonth')}>Month</button>
                                <button className={viewType === 'timeGridWeek' ? styles.active : ''} onClick={() => changeView('timeGridWeek')}>Week</button>
                                <button onClick={() => handleNav('today')} className={styles.todayButton}>Today</button>
                            </div>
                        </div>
                        <div className={styles.calendarContent}>
                            <FullCalendar
                                ref={calendarRef}
                                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                                initialView={viewType}
                                headerToolbar={false}
                                dayMaxEvents={true}
                                moreLinkClick={handleMoreLinkClick}
                                moreLinkContent={(args) => `+ ${args.num} more`}
                                events={processedEvents}
                                editable={true}
                                droppable={true}
                                drop={handleEventDropOnCalendar}
                                selectable={true}
                                eventClick={handleEventClick}
                                dateClick={handleDateClick}
                                datesSet={(arg) => {
                                    setCurrentDate(arg.view.currentStart);
                                    setViewRange({ start: arg.view.activeStart, end: arg.view.activeEnd });
                                    setCurrentTitle(arg.view.title);
                                }}
                                locale={'ko'}
                                eventContent={renderEventContent}
                            />
                        </div>
                    </div>
                    <UniversityTimetable />
                </div>
                <div className={styles.rightColumn}>
                    <div className={`${styles.panel} ${styles.agendaContainer}`}>
                        <div className={styles.panelHeader}>
                            <h3><FontAwesomeIcon icon={faCalendarDays} /> Today's Agenda</h3>
                            <span className={styles.date}>{dayjs(currentDate).format('MM월 DD일 dddd')}</span>
                        </div>
                        <div className={styles.scrollableContent}>
                            {todaysEvents.length > 0 ? (
                                <ul className={styles.agendaList}>
                                    {todaysEvents.map(event => (
                                        <li
                                            key={event.id}
                                            className={`${styles.agendaItem} ${selectedEventId === event.id ? styles.selected : ''}`}
                                            onClick={() => setSelectedEventId(event.id!)}
                                            style={{ '--event-color': (event.extendedProps as ScheduleEvent).color || '#3788d8' } as React.CSSProperties}
                                        >
                                            <div className={styles.agendaLeft}>
                                                <div className={styles.ownerIcon} style={{ backgroundColor: (event.extendedProps as ScheduleEvent).color }}>
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
                                    ))}
                                </ul>
                            ) : (<div className={styles.noItems}>오늘 등록된 일정이 없습니다.</div>)}
                        </div>
                    </div>
                    <div className={`${styles.panel} ${styles.todoContainer}`}>
                        <div className={styles.panelHeader}>
                            <h3>To-Do List</h3>
                            <span className={styles.todoHeaderSubtitle}>{selectedEvent?.title || '일정 선택 필요'}</span>
                        </div>
                        <div className={styles.scrollableContent}>
                            {selectedEventId ? (
                                (selectedEvent?.extendedProps as ScheduleEvent)?.isEditable ? (
                                    <ul className={styles.todoList}>
                                        {selectedEventTasks.length > 0 ? selectedEventTasks.map(task => (
                                            <li key={task.id} className={`${styles.todoItem} ${task.status === 'DONE' ? styles.completed : ''}`}>
                                                <span className={styles.todoCheckbox} onClick={() => handleToggleTask(task.id)}>
                                                    <FontAwesomeIcon icon={faCheck} size="xs" />
                                                </span>
                                                <span className={styles.todoTitle}>{task.title}</span>
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

            {morePopover && (
                <div className={styles.morePopoverWrapper} onClick={() => setMorePopover(null)}>
                    <div className={styles.morePopover} style={popoverStyle} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.popoverHeader}>
                            <h4>{dayjs(morePopover.date).format('MM월 DD일 dddd')}</h4>
                            <button onClick={() => setMorePopover(null)} className={styles.closePopover}><FontAwesomeIcon icon={faTimes} /></button>
                        </div>
                        <ul className={styles.morePopoverList}>
                            {morePopover.events.map(event => (
                                <li
                                    key={event.id}
                                    className={styles.morePopoverItem}
                                    onClick={() => handlePopoverEventClick(event)} 
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, event)} 
                                >
                                    {renderEventContent({ event } as EventContentArg)}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}

            {isModalOpen && <EventEditorModal event={editingEvent} onClose={() => setIsModalOpen(false)} onSave={handleSaveEvent} onDelete={handleDeleteEvent} />}
        </>
    );
};

export default SchedulePage;