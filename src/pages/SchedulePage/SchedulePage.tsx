// kdae/src - front/pages/SchedulePage/SchedulePage.tsx

import React, { useState, useMemo, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin, { type DateClickArg } from '@fullcalendar/interaction';
// [수정] EventContentArg는 @fullcalendar/core에서 가져옵니다.
import type { EventClickArg, EventInput, EventContentArg } from '@fullcalendar/core';
import { RRule } from 'rrule';
import dayjs from 'dayjs';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faCheck, faLayerGroup, faUser, faCalendarDays } from '@fortawesome/free-solid-svg-icons';
import 'dayjs/locale/ko';

import styles from './SchedulePage.module.css';
import type { ScheduleEvent, EventTask, EventParticipant } from './types';
import EventEditorModal from './EventEditorModal';
import UniversityTimetable from './UniversityTimetable';

dayjs.locale('ko');

// --- 목업 데이터: 로그인한 사용자 정보 및 각종 데이터 ---
const CURRENT_USER_ID = 123;
const CURRENT_USER_NAME = '김세현';

const mockParticipants: EventParticipant[] = [
    { userId: CURRENT_USER_ID, userName: CURRENT_USER_NAME, status: 'ACCEPTED' },
    { userId: 456, userName: '박서연', status: 'ACCEPTED' },
    { userId: 789, userName: '이대은', status: 'TENTATIVE' },
    { userId: 101, userName: '최민준', status: 'DECLINED' },
];

const mockEvents: ScheduleEvent[] = [
    // 개인 이벤트 (USER)
    {
        id: 'event-user-1',
        title: '개인 프로젝트 기획',
        start: dayjs().add(1, 'day').hour(10).toISOString(),
        end: dayjs().add(1, 'day').hour(12).minute(30).toISOString(),
        allDay: false,
        location: '자택',
        ownerType: 'USER',
        ownerId: CURRENT_USER_ID,
        color: '#17a88f',
        description: '개인 포트폴리오 프로젝트의 초기 기획 및 아이디어 구체화 작업.',
        participants: [{ userId: CURRENT_USER_ID, userName: CURRENT_USER_NAME, status: 'ACCEPTED' }],
    },
    {
        id: 'event-user-2',
        title: '알고리즘 스터디',
        start: dayjs().add(3, 'day').format('YYYY-MM-DD'),
        allDay: true,
        ownerType: 'USER',
        ownerId: CURRENT_USER_ID,
        color: '#3b82f6',
        description: '백준 문제 풀이 및 코드 리뷰'
    },
    // 그룹 이벤트 (GROUP)
    {
        id: 'event-group-1',
        title: '캡스톤 디자인 정기 회의',
        start: '2025-07-18T14:00:00',
        end: '2025-07-18T16:00:00',
        allDay: false,
        location: '공학관 611호',
        ownerType: 'GROUP',
        ownerId: 1,
        color: '#8400ff',
        rrule: 'FREQ=WEEKLY;BYDAY=FR;UNTIL=20250829T235959Z',
        description: '매주 금요일 진행되는 캡스톤 디자인 팀 정기 회의입니다. 주요 안건을 미리 확인해주세요.',
        participants: mockParticipants,
        createdBy: 456, // 다른 사람이 생성한 것으로 가정
    },
    {
        id: 'event-group-2',
        title: 'Bloom Us 팀 회고',
        start: dayjs().add(1, 'week').format('YYYY-MM-DD'),
        allDay: true,
        ownerType: 'GROUP',
        ownerId: 2,
        color: '#e5096f',
        description: '지난 스프린트 회고 및 다음 스프린트 계획 논의',
        participants: mockParticipants,
        createdBy: CURRENT_USER_ID,
    },
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

const SchedulePage: React.FC = () => {
    const [events, setEvents] = useState<ScheduleEvent[]>(mockEvents);
    const [tasks, setTasks] = useState<EventTask[]>(mockTasks);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [viewRange, setViewRange] = useState({ start: new Date(), end: new Date() });
    const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEvent, setEditingEvent] = useState<ScheduleEvent | null>(null);
    
    // 캘린더에 표시될 이벤트 가공 (useMemo로 최적화)
    const processedEvents = useMemo((): EventInput[] => {
        const calendarEvents: EventInput[] = [];
        const viewStart = dayjs(viewRange.start).startOf('day');
        const viewEnd = dayjs(viewRange.end).endOf('day');

        events.forEach(event => {
            const isEditable = event.ownerType === 'USER';
            if (event.rrule && event.end) { // end가 있어야 반복규칙 계산 가능
                try {
                    const rule = new RRule({ ...RRule.parseString(event.rrule), dtstart: dayjs(event.start).toDate() });
                    rule.between(viewStart.toDate(), viewEnd.toDate()).forEach(date => {
                        const duration = dayjs(event.end).diff(dayjs(event.start));
                        const instanceStart = dayjs(date);
                        const instanceEnd = instanceStart.add(duration, 'ms');
                        calendarEvents.push({
                            ...event,
                            id: getEventInstanceId(event, date),
                            start: instanceStart.toDate(),
                            end: instanceEnd.toDate(),
                            classNames: [ styles.calendarEvent, event.ownerType === 'GROUP' ? styles.groupEvent : styles.userEvent ],
                            extendedProps: { ...event, isEditable }
                        });
                    });
                } catch (e) { console.error("Error parsing rrule:", e); }
            } else {
                if (dayjs(event.start).isBefore(viewEnd) && dayjs(event.end ?? event.start).isAfter(viewStart)) {
                    calendarEvents.push({
                        ...event,
                        id: event.id,
                        classNames: [ styles.calendarEvent, event.ownerType === 'GROUP' ? styles.groupEvent : styles.userEvent ],
                        extendedProps: { ...event, isEditable }
                    });
                }
            }
        });
        return calendarEvents;
    }, [events, viewRange]);

    // 날짜 클릭: 무조건 '개인 일정' 생성
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
        });
        setIsModalOpen(true);
    };

    // 이벤트 클릭: 개인/그룹 따라 'isEditable' 설정 후 모달 열기
    const handleEventClick = (arg: EventClickArg) => {
        const instanceId = arg.event.id;
        const props = arg.event.extendedProps as ScheduleEvent;
        const isEditable = props.ownerType === 'USER';

        setEditingEvent({
            ...props,
            id: instanceId,
            start: dayjs(arg.event.start).toISOString(),
            end: arg.event.end ? dayjs(arg.event.end).toISOString() : dayjs(arg.event.start).add(1, 'hour').toISOString(),
            tasks: tasks.filter(t => t.eventId === instanceId || t.eventId === props.id),
            isEditable,
        });
        setIsModalOpen(true);
        setSelectedEventId(instanceId);
    };

    // 저장 핸들러: 개인 일정만 생성/수정 가능
    const handleSaveEvent = (eventData: ScheduleEvent) => {
        if (!eventData.isEditable || eventData.ownerType !== 'USER') {
            alert("그룹 일정은 이 페이지에서 수정할 수 없습니다.");
            return;
        }
        const isNew = String(eventData.id).startsWith('temp-');
        const finalEvent = { ...eventData, id: isNew ? `event-user-${Date.now()}` : eventData.id };

        setEvents(prev => isNew ? [...prev, finalEvent] : prev.map(e => e.id === finalEvent.id ? finalEvent : e));
        
        setTasks(prevTasks => {
            const otherTasks = prevTasks.filter(t => t.eventId !== eventData.id);
            const updatedTasks = (finalEvent.tasks || []).map(task => ({
                ...task,
                id: task.id > 1000000 ? task.id : Date.now() + Math.random(), // 새 태스크 ID 부여
                eventId: finalEvent.id
            }));
            return [...otherTasks, ...updatedTasks];
        });

        setIsModalOpen(false);
    };
    
    // 삭제 핸들러: 개인 일정만 삭제 가능
    const handleDeleteEvent = (eventId: string) => {
        const originalId = eventId.split('-')[0] === 'event' ? eventId.split('-').slice(0, 3).join('-') : eventId;
        const eventToDelete = events.find(e => e.id === originalId);

        if (!eventToDelete || eventToDelete.ownerType !== 'USER') {
            alert("그룹 일정은 이 페이지에서 삭제할 수 없습니다.");
            return;
        }

        setEvents(prev => prev.filter(e => e.id !== originalId));
        setTasks(prev => prev.filter(t => !t.eventId.startsWith(originalId)));
        
        setIsModalOpen(false);
        if (selectedEventId?.startsWith(originalId)) {
            setSelectedEventId(null);
        }
    };
    
    // 캘린더 이벤트 UI 커스텀 함수
    const renderEventContent = (eventInfo: EventContentArg) => {
        const props = eventInfo.event.extendedProps as ScheduleEvent;
        return (
            <div className={styles.eventContentWrapper}>
                <FontAwesomeIcon 
                    icon={props.ownerType === 'USER' ? faUser : faLayerGroup} 
                    className={styles.eventOwnerIcon} 
                />
                <span className={styles.eventTitle}>{eventInfo.event.title}</span>
            </div>
        );
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
        return tasks.filter(t => t.eventId === selectedEventId || t.eventId === originalId);
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
            const newTask: EventTask = {
                id: Date.now(),
                eventId: originalId,
                title: e.currentTarget.value.trim(),
                status: 'TODO',
                dueDate: null,
            };
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

    return (
        <>
            <div className={styles.pageContainer}>
                <div className={styles.leftColumn}>
                    <UniversityTimetable />
                    <div className={`${styles.panel} ${styles.calendarWrapper}`}>
                        <FullCalendar
                            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                            initialView="dayGridMonth"
                            headerToolbar={{ left: 'prev,next today', center: 'title', right: 'dayGridMonth,timeGridWeek' }}
                            events={processedEvents}
                            editable={true}
                            selectable={true}
                            eventClick={handleEventClick}
                            dateClick={handleDateClick}
                            datesSet={(arg) => {
                                setCurrentDate(arg.view.currentStart);
                                setViewRange({ start: arg.view.activeStart, end: arg.view.activeEnd });
                            }}
                            height="100%"
                            locale={'ko'}
                            eventContent={renderEventContent}
                        />
                    </div>
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
                                            style={{'--event-color': event.color || '#3788d8'} as React.CSSProperties}
                                        >
                                            <div className={styles.agendaLeft}>
                                                <div className={styles.ownerIcon} style={{backgroundColor: event.color}}>
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
                                (selectedEvent?.extendedProps as ScheduleEvent)?.ownerType === 'USER' ? (
                                    <ul className={styles.todoList}>
                                        {selectedEventTasks.length > 0 ? selectedEventTasks.map(task => (
                                            <li key={task.id} className={`${styles.todoItem} ${task.status === 'DONE' ? styles.completed : ''}`}>
                                                <span className={styles.todoCheckbox} onClick={() => handleToggleTask(task.id)}>
                                                    <FontAwesomeIcon icon={faCheck} size="xs" />
                                                </span>
                                                <span className={styles.todoTitle}>{task.title}</span>
                                            </li>
                                        )) : <div className={styles.noItems}>할 일이 없습니다.<br/>새로운 할 일을 추가해보세요.</div>}
                                    </ul>
                                ) : (
                                    <div className={styles.noItems}>그룹 일정의 할 일은<br/>해당 그룹 채널에서 관리됩니다.</div>
                                )
                            ) : (<div className={styles.noItems}>일정을 선택하여<br />할 일을 확인하세요.</div>)}
                        </div>
                        {selectedEvent && (selectedEvent.extendedProps as ScheduleEvent)?.ownerType === 'USER' && (
                            <div className={styles.addTodoWrapper}>
                                <FontAwesomeIcon icon={faPlus} className={styles.addTodoIcon} />
                                <input type="text" placeholder="새로운 할 일 추가 (Enter)" className={styles.addTodoInput} onKeyDown={handleAddTask} />
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
                />
            }
        </>
    );
};

export default SchedulePage;