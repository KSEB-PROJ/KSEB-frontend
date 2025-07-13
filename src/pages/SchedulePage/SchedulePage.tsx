//잔쩌 정신 나갈 것 같아
import React, { useState, useMemo, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin, { type DateClickArg } from '@fullcalendar/interaction';
import type { EventClickArg, EventInput } from '@fullcalendar/core';
import { RRule } from 'rrule';
import dayjs from 'dayjs';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck } from '@fortawesome/free-solid-svg-icons';

import styles from './SchedulePage.module.css';
import type { ScheduleEvent, EventTask } from './types';
import EventEditorModal from './EventEditorModal';
import UniversityTimetable from './UniversityTimetable';

// --- 예시 데이터 ---
const mockEvents: ScheduleEvent[] = [
    {
        id: 'event-1',
        title: '캡스톤 디자인 정기 회의',
        start: '2025-07-04T14:00:00',
        end: '2025-07-04T16:00:00',
        allDay: false,
        location: '공학관 611호',
        ownerType: 'GROUP', ownerId: 1,
        color: '#8400ff',
        rrule: 'FREQ=WEEKLY;BYDAY=FR;UNTIL=20250829T235959Z'
    },
    { id: 'event-2', title: '팀플메이트 런칭', start: '2025-07-29', end: '2025-07-29', allDay: true, ownerType: 'GROUP', ownerId: 1, color: '#e5096f' },
    { id: 'event-3', title: '개인 프로젝트 마감', start: '2025-07-28', end: '2025-07-28', allDay: true, ownerType: 'USER', ownerId: 123, color: '#17a88f' },
    { id: 'event-4', title: '알고리즘 스터디', start: '2025-07-26', end: '2025-07-26', allDay: true, ownerType: 'USER', ownerId: 123, color: '#3b82f6' },
];

const mockTasks: EventTask[] = [
    { id: 1, eventId: 'event-1-20250704', title: '발표 PPT 최종 검토', isCompleted: true },
    { id: 2, eventId: 'event-1-20250711', title: '발표 대본 암기', isCompleted: false },
    { id: 3, eventId: 'event-1-20250718', title: '시연 영상 렌더링', isCompleted: false },
    { id: 4, eventId: 'event-3-20250728', title: 'README 파일 작성', isCompleted: true },
    { id: 5, eventId: 'event-3-20250728', title: '최종 코드 푸시', isCompleted: false },
];

function getEventInstanceId(event: ScheduleEvent, date: Date | string) {
    const d = dayjs(date);
    return `${event.id}-${d.format('YYYYMMDD')}`;
}

const SchedulePage: React.FC = () => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [viewRange, setViewRange] = useState({ start: new Date(), end: new Date() });
    const [events, setEvents] = useState<ScheduleEvent[]>(mockEvents);
    const [tasks, setTasks] = useState<EventTask[]>(mockTasks);
    const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEvent, setEditingEvent] = useState<ScheduleEvent | null>(null);

    // 반복 규칙 확장 + instance별 id 생성
    const processedEvents = useMemo(() => {
        const calendarEvents: EventInput[] = [];
        events.forEach(event => {
            if (event.rrule) {
                const rule = new RRule({
                    ...RRule.parseString(event.rrule),
                    dtstart: dayjs(event.start).toDate(),
                });
                rule.between(viewRange.start, viewRange.end).forEach(date => {
                    const duration = dayjs(event.end).diff(dayjs(event.start));
                    calendarEvents.push({
                        ...event,
                        id: getEventInstanceId(event, date),
                        originalId: event.id,
                        start: date,
                        end: dayjs(date).add(duration, 'ms').toDate(),
                    });
                });
            } else {
                calendarEvents.push({
                    ...event,
                    id: getEventInstanceId(event, event.start),
                    originalId: event.id,
                    start: event.start,
                    end: event.end,
                });
            }
        });
        return calendarEvents;
    }, [events, viewRange]);

    const handleDateClick = (arg: DateClickArg) => {
        const tempId = `temp-${Date.now()}`;
        setEditingEvent({
            id: tempId,
            originalId: tempId,
            title: '',
            start: arg.dateStr,
            end: arg.dateStr,
            allDay: arg.allDay,
            ownerType: 'USER',
            ownerId: 123,
        });
        setIsModalOpen(true);
    };

    const handleEventClick = (arg: EventClickArg) => {
        const eventId = arg.event.extendedProps.originalId || arg.event.id;
        const instanceStart = arg.event.start as Date;

        const originalEvent = events.find(e => e.id === eventId);
        if (originalEvent) {
            const instanceId = getEventInstanceId(originalEvent, instanceStart);

            setEditingEvent({
                ...originalEvent,
                id: instanceId,
                originalId: originalEvent.id,
                start: dayjs(instanceStart).format(originalEvent.allDay ? 'YYYY-MM-DD' : 'YYYY-MM-DDTHH:mm'),
                end: originalEvent.end,
            });
            setIsModalOpen(true);
            setSelectedEventId(instanceId);
        }
    };


    const handleSaveEvent = (eventData: ScheduleEvent) => {
        const isEdit = events.findIndex(e => e.id === (eventData.originalId || eventData.id)) > -1;
        if (isEdit) {
            setEvents(prev =>
                prev.map(e =>
                    e.id === (eventData.originalId || eventData.id)
                        ? { ...e, ...eventData, id: eventData.originalId || eventData.id }
                        : e
                )
            );
        } else {
            setEvents(prev => [...prev, { ...eventData, id: eventData.id, originalId: eventData.id }]);
        }
        setIsModalOpen(false);
    };

    const handleDeleteEvent = (eventId: string) => {
        setEvents(prev => prev.filter(e => e.id !== eventId && e.id !== (events.find(ev => getEventInstanceId(ev, ev.start) === eventId)?.id)));
        setTasks(prev => prev.filter(t => t.eventId !== eventId));
        setIsModalOpen(false);
        if (selectedEventId === eventId) setSelectedEventId(null);
    };

    const todaysEvents = useMemo(() =>
        processedEvents
            .filter(e => dayjs(e.start as string).isSame(currentDate, 'day'))
            .sort((a, b) => dayjs(a.start as string).valueOf() - dayjs(b.start as string).valueOf()),
        [processedEvents, currentDate]
    );

    const selectedEventTasks = useMemo(() =>
        tasks.filter(t => selectedEventId && t.eventId === selectedEventId),
        [tasks, selectedEventId]
    );

    const handleToggleTask = (taskId: number) => {
        setTasks(prev => prev.map(t => (t.id === taskId ? { ...t, isCompleted: !t.isCompleted } : t)));
    };
    const handleAddTask = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && selectedEventId && e.currentTarget.value.trim()) {
            const newTask: EventTask = {
                id: Date.now(),
                eventId: selectedEventId,
                title: e.currentTarget.value.trim(),
                isCompleted: false,
            };
            setTasks(prev => [...prev, newTask]);
            e.currentTarget.value = '';
        }
    };

    useEffect(() => {
        if (todaysEvents.length > 0 && !todaysEvents.find(e => e.id === selectedEventId)) {
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
                        />
                    </div>
                </div>
                <div className={styles.rightColumn}>
                    <div className={`${styles.panel} ${styles.agendaContainer}`}>
                        <div className={styles.panelHeader}>
                            <h3>Agenda</h3>
                            <span className={styles.date}>{dayjs(currentDate).format('MM.DD ddd')}</span>
                        </div>
                        <div className={styles.scrollableContent}>
                            {todaysEvents.length > 0 ? (
                                <ul className={styles.agendaList}>
                                    {todaysEvents.map(event => (
                                        <li
                                            key={event.id}
                                            className={`${styles.agendaItem} ${selectedEventId === event.id ? styles.selected : ''}`}
                                            onClick={() => setSelectedEventId(event.id!)}
                                        >
                                            <span className={styles.agendaTime}>
                                                {event.allDay ? '종일' : dayjs(event.start as string).format('HH:mm')}
                                            </span>
                                            <span className={styles.agendaTitle}>{event.title}</span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (<div className={styles.noItems}>오늘 일정이 없습니다.</div>)}
                        </div>
                    </div>
                    <div className={`${styles.panel} ${styles.todoContainer}`}>
                        <div className={styles.panelHeader}><h3>To-Do List</h3></div>
                        <div className={styles.scrollableContent}>
                            {selectedEventId ? (
                                <ul className={styles.todoList}>
                                    {selectedEventTasks.map(task => (
                                        <li key={task.id} className={`${styles.todoItem} ${task.isCompleted ? styles.completed : ''}`}>
                                            <span className={styles.todoCheckbox} onClick={() => handleToggleTask(task.id)}>
                                                <FontAwesomeIcon icon={faCheck} size="xs" />
                                            </span>
                                            <span className={styles.todoTitle}>{task.title}</span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (<div className={styles.noItems}>일정을 선택하여<br />할 일을 확인하세요.</div>)}
                        </div>
                        {selectedEventId && (
                            <input type="text" placeholder="새로운 할 일 추가 (Enter)" className={styles.addTodoInput} onKeyDown={handleAddTask} />
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
