/**
 * @file EventEditorModal.tsx
 * @description 개인 또는 그룹 일정을 생성하거나 편집하기 위한 모달 컴포넌트입니다.
 * - 사용자는 이 모달을 통4해 일정의 제목, 시간, 장소, 반복 규칙, 색상, 설명, 할 일 등 모든 세부 정보를 관리할 수 있습니다.
 * - 그룹 일정의 경우, 참여자 목록과 자신의 참여 상태(참석/미정/거절)를 변경할 수 있습니다.
 * - 일정 데이터 자체는 부모 컴포넌트로부터 `event` prop으로 전달받고, 변경된 결과는 `onSave`, `onDelete` 콜백을 통해 부모에게 알립니다.
 * - 일부 데이터(참여 상태 등) 변경 후에는 `onEventUpdate` 콜백을 호출하여 부모의 전체 데이터 새로고침을 유도합니다.
 */
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { IconDefinition } from '@fortawesome/free-solid-svg-icons';
import {
    faClock, faSync, faMapMarkerAlt, faAlignLeft, faCalendarDay, faTimes,
    faSignature, faPlus, faTrash, faTasks, faLock, faUsers, faCheckCircle,
    faTimesCircle, faQuestionCircle, faPalette, faLayerGroup, faCheck
} from '@fortawesome/free-solid-svg-icons';
import type { ScheduleEvent, EventTask, EventParticipant, UpdateTaskRequest } from '../../../../types'; // ✅ 경로 수정
import styles from './EventEditorModal.module.css';
import RecurrenceEditor from '../RecurrenceEditor/RecurrenceEditor';
import DatePicker from '../../../../components/date-picker/DatePicker'; // ✅ 경로 수정
import { updateTask, deleteTask } from '../../../../api/tasks'; // ✅ 경로 수정
import { updateParticipantStatus } from '../../../../api/events'; // ✅ 경로 수정
import toast from 'react-hot-toast';
import dayjs from 'dayjs';
import { useAuthStore } from '../../../../stores/authStore'; // ✅ 경로 수정

const colorPalette = [
    '#8400ff', '#14d6ae', '#ec4899', '#3b82f6',
    '#f97316', '#22c55e', '#eab308', '#06b6d4',
    '#ef4444', '#6366f1', '#a855f7', '#10b981'
];
const statusMap: { [key in EventTask['status']]: number } = { 'TODO': 1, 'DOING': 2, 'DONE': 3 };

/**
 * @description 이벤트에 종속된 개별 할 일(Task) 항목을 렌더링하는 내부 컴포넌트
 */
const TaskItem: React.FC<{
    task: EventTask;
    onUpdate: (taskId: number, field: keyof EventTask, value: EventTask[keyof EventTask]) => void;
    onDelete: (taskId: number) => void;
    isEditable: boolean;
}> = ({ task, onUpdate, onDelete, isEditable }) => {
    const statuses: EventTask['status'][] = ['TODO', 'DOING', 'DONE'];
    const [isEditing, setIsEditing] = useState(false);
    const textRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isEditing && textRef.current) {
            textRef.current.focus();
            const range = document.createRange();
            const sel = window.getSelection();
            range.selectNodeContents(textRef.current);
            range.collapse(false);
            sel?.removeAllRanges();
            sel?.addRange(range);
        }
    }, [isEditing]);

    const handleBlur = () => {
        setIsEditing(false);
        if (textRef.current) {
            onUpdate(task.id, 'title', textRef.current.innerText);
        }
    };

    return (
        <li className={styles.taskItem}>
            <div className={styles.statusPillGroup}>
                {statuses.map(status => (
                    <button
                        key={status}
                        data-status={status}
                        className={`${styles.statusPill} ${task.status === status ? styles.active : ''}`}
                        onClick={() => onUpdate(task.id, 'status', status)}
                        disabled={!isEditable}
                    >
                        {status === 'TODO' && '할 일'}
                        {status === 'DOING' && '진행중'}
                        {status === 'DONE' && '완료'}
                    </button>
                ))}
            </div>
            <div
                ref={textRef}
                className={`${styles.taskTitle} ${isEditing ? styles.editing : ''}`}
                contentEditable={isEditable}
                onClick={() => isEditable && setIsEditing(true)}
                onBlur={handleBlur}
                onKeyDown={(e: React.KeyboardEvent<HTMLDivElement>) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        e.currentTarget.blur();
                    }
                }}
                suppressContentEditableWarning={true}
            >
                {task.title || (isEditable ? '' : '새로운 할 일')}
            </div>

            <div className={styles.taskDueDate}>
                <DatePicker value={task.dueDate} onChange={(date: string | null) => onUpdate(task.id, 'dueDate', date)} showTime isEditable={isEditable} />
            </div>
            <button onClick={() => onDelete(task.id)} className={styles.deleteTaskButton} title="삭제" disabled={!isEditable}>
                <FontAwesomeIcon icon={faTrash} />
            </button>
        </li>
    );
};


// 메인 모달 컴포넌트
const EventEditorModal: React.FC<{
    event: ScheduleEvent | null;
    onClose: () => void;
    onSave: (event: ScheduleEvent) => void;
    onDelete: (eventId: string) => void;
    onEventUpdate: () => void;
}> = ({ event, onClose, onSave, onDelete, onEventUpdate }) => {
    const [formData, setFormData] = useState<ScheduleEvent | null>(null);
    const [isRecurrenceEnabled, setRecurrenceEnabled] = useState(false);
    const [isClosing, setIsClosing] = useState(false);
    const { user: currentUser } = useAuthStore();

    const isEditable = useMemo(() => formData?.isEditable ?? false, [formData]);
    const modalKey = useMemo(() => (event?.id || 'new') + '-' + Date.now(), [event]);
    
    useEffect(() => {
        setFormData(event);
        if (event) {
            setRecurrenceEnabled(!!event.rrule);
        }
    }, [event]);

    const handleClose = useCallback(() => {
        setIsClosing(true);
        setTimeout(onClose, 300);
    }, [onClose]);

    const updateFormData = useCallback((field: keyof ScheduleEvent, value: ScheduleEvent[keyof ScheduleEvent]) => {
        setFormData((prev: ScheduleEvent | null) => (prev ? { ...prev, [field]: value } : null));
    }, []);

    const handleSave = () => {
        if (!formData) return;
        if (isEditable && !formData.title.trim()) {
            toast.error('일정 제목을 입력해주세요.');
            return;
        }
        if (isEditable && !formData.color) {
            toast.error('테마 색상을 선택해주세요.');
            return;
        }
        onSave(formData);
    };

    const handleDelete = () => {
        if (!isEditable || !formData) return;
        onDelete(formData.id);
    };

    const handleParticipantStatusChange = (newStatus: EventParticipant['status']) => {
        if (!formData || !currentUser || formData.ownerType !== 'GROUP' || String(formData.id).startsWith('temp-')) return;
        
        const originalParticipants = formData.participants;
        
        const updatedParticipants = formData.participants?.map((p: EventParticipant) =>
            p.userId === currentUser.id ? { ...p, status: newStatus } : p
        ) || [];

        const updatedFormData = { ...formData, participants: updatedParticipants };
        setFormData(updatedFormData);

        const eventId = parseInt(formData.id);
        const promise = updateParticipantStatus(formData.ownerId, eventId, newStatus);
        
        toast.promise(promise, {
            loading: '상태 업데이트 중...',
            success: () => {
                onEventUpdate();
                return '참여 상태가 변경되었습니다.';
            },
            error: (err) => {
                setFormData((prev: ScheduleEvent | null) => prev ? { ...prev, participants: originalParticipants } : null);
                console.error("상태 변경 실패:", err);
                return '상태 변경에 실패했습니다.';
            }
        });
    };

    const handleAddTask = () => {
        if (!formData || !isEditable) return;
        const newTask: EventTask = { id: Date.now(), eventId: formData.id, title: '새로운 할 일', status: 'TODO', dueDate: null };
        updateFormData('tasks', [...(formData.tasks || []), newTask]);
    };

    const handleUpdateTask = (taskId: number, field: keyof EventTask, value: EventTask[keyof EventTask]) => {
        if (!formData || !isEditable) return;

        const updatedTasks = formData.tasks?.map((t: EventTask) => t.id === taskId ? { ...t, [field]: value } : t);
        updateFormData('tasks', updatedTasks);

        const isTemporaryTask = taskId > 1000000000000;

        if (!isTemporaryTask) {
            const requestData: UpdateTaskRequest = {};
            if (field === 'title') requestData.title = value as string;
            if (field === 'dueDate') requestData.dueDatetime = value ? dayjs(value as string).format('YYYY-MM-DDTHH:mm:ss') : null;
            if (field === 'status') requestData.statusId = statusMap[value as EventTask['status']];

            if (Object.keys(requestData).length > 0) {
                toast.promise(updateTask(taskId, requestData), {
                    loading: '업데이트 중...',
                    success: <b>업데이트 완료!</b>,
                    error: <b>업데이트 실패.</b>
                });
            }
        }
    };

    const handleDeleteTask = (taskId: number) => {
        if (!formData || !isEditable) return;

        const filteredTasks = formData.tasks?.filter((t: EventTask) => t.id !== taskId);
        updateFormData('tasks', filteredTasks);

        const isTemporaryTask = taskId > 1000000000000;

        if (!isTemporaryTask) {
            toast.promise(deleteTask(taskId), {
                loading: '삭제 중...',
                success: <b>삭제되었습니다.</b>,
                error: <b>삭제에 실패했습니다.</b>
            });
        }
    };

    const handleRecurrenceChange = useCallback((rrule: string | undefined) => {
        updateFormData('rrule', rrule);
    }, [updateFormData]);

    /**
     * @description 참여자의 상태(참석/거절/미정)에 따라 아이콘을 반환하는 컴포넌트
     */
    const ParticipantStatusIcon = ({ status }: { status: EventParticipant['status'] }) => {
        // ✅ Record 유틸리티 타입을 사용하여 iconMap의 타입을 명확히 함
        const iconMap: Record<EventParticipant['status'], { icon: IconDefinition; className: string; title: string; }> = {
            'ACCEPTED': { icon: faCheckCircle, className: styles.statusAccepted, title: "참석" },
            'DECLINED': { icon: faTimesCircle, className: styles.statusDeclined, title: "거절" },
            'TENTATIVE': { icon: faQuestionCircle, className: styles.statusTentative, title: "미정" }
        };
        // ✅ iconMap[status]가 항상 유효하다고 TypeScript에 알려줌
        const { icon, className, title } = iconMap[status];
        return <FontAwesomeIcon icon={icon} className={className} title={title} />;
    };

    if (!formData) return null;

    const currentUserStatus = formData.participants?.find((p: EventParticipant) => p.userId === currentUser?.id)?.status;

    return (
        <div className={`${styles.overlay} ${isClosing ? styles.closing : ''}`} onClick={handleClose}>
            <div
                className={`${styles.modalContainer} ${isClosing ? styles.closing : ''}`}
                onClick={(e: React.MouseEvent) => e.stopPropagation()}
                style={{ '--event-theme-color': formData.color } as React.CSSProperties}
            >
                <header className={styles.header}>
                    <div className={styles.headerLeft}>
                        {formData.ownerType === 'GROUP' && formData.groupName && (
                            <div className={styles.groupInfoBadge}>
                                <FontAwesomeIcon icon={faLayerGroup} />
                                <span>{formData.groupName}</span>
                            </div>
                        )}
                    </div>
                    <div className={styles.headerCenter}>
                        <h2>{String(formData.id).startsWith('temp-') ? '새 일정 추가' : '일정 정보'}</h2>
                    </div>
                    <div className={styles.headerRight}>
                        {!isEditable && <div className={styles.readOnlyBadge}><FontAwesomeIcon icon={faLock} /> 읽기 전용</div>}
                        <button className={styles.closeButton} onClick={handleClose}><FontAwesomeIcon icon={faTimes} /></button>
                    </div>
                </header>


                <main className={styles.content}>
                    <div className={styles.inputGroup}>
                        <input id="title" type="text" value={formData.title} onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateFormData('title', e.target.value)} placeholder=" " autoFocus disabled={!isEditable} />
                        <label htmlFor="title"><FontAwesomeIcon icon={faSignature} /> 일정 제목</label>
                    </div>
                    <div className={styles.inputGroup}>
                        <input id="location" type="text" value={formData.location || ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateFormData('location', e.target.value)} placeholder=" " disabled={!isEditable} />
                        <label htmlFor='location'><FontAwesomeIcon icon={faMapMarkerAlt} /> 장소 또는 링크</label>
                    </div>

                    {formData.ownerType === 'GROUP' && (
                        <>
                            <div className={styles.sectionDivider} />
                            <div className={styles.participantSection}>
                                <div className={styles.participantHeader}>
                                    <div className={styles.textareaLabel}>
                                        <FontAwesomeIcon icon={faUsers} />
                                        <span>참여자 ({formData.participants?.length || 0})</span>
                                    </div>
                                    <div className={styles.statusIconGroup}>
                                        <button
                                            className={`${styles.statusIconButton} ${currentUserStatus === 'ACCEPTED' ? styles.active : ''}`}
                                            onClick={() => handleParticipantStatusChange('ACCEPTED')}
                                            data-status="accepted"
                                            title="참석"
                                            disabled={String(formData.id).startsWith('temp-')}
                                        >
                                            <FontAwesomeIcon icon={faCheckCircle} />
                                        </button>
                                        <button
                                            className={`${styles.statusIconButton} ${currentUserStatus === 'TENTATIVE' ? styles.active : ''}`}
                                            onClick={() => handleParticipantStatusChange('TENTATIVE')}
                                            data-status="tentative"
                                            title="미정"
                                            disabled={String(formData.id).startsWith('temp-')}
                                        >
                                            <FontAwesomeIcon icon={faQuestionCircle} />
                                        </button>
                                        <button
                                            className={`${styles.statusIconButton} ${currentUserStatus === 'DECLINED' ? styles.active : ''}`}
                                            onClick={() => handleParticipantStatusChange('DECLINED')}
                                            data-status="declined"
                                            title="거절"
                                            disabled={String(formData.id).startsWith('temp-')}
                                        >
                                            <FontAwesomeIcon icon={faTimesCircle} />
                                        </button>
                                    </div>
                                </div>
                                <ul className={styles.participantList}>
                                    {formData.participants?.map((p: EventParticipant) => (
                                        <li key={p.userId}>
                                            <ParticipantStatusIcon status={p.status} />
                                            <span>{p.userName}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </>
                    )}


                    <div className={styles.sectionDivider} />

                    <div className={styles.controlSection}>
                        <div className={styles.controlRow}>
                            <div className={styles.controlLabel}><FontAwesomeIcon icon={faClock} />시간</div>
                            <div className={styles.controlContent}>
                                <div className={styles.datePickerGroup}>
                                    <DatePicker value={formData.start} onChange={(iso: string | null) => updateFormData('start', iso || '')} showTime={!formData.allDay} isEditable={isEditable} />
                                    {!formData.allDay && formData.end && <span className={styles.timeSeparator}>~</span>}
                                    {!formData.allDay && formData.end && <DatePicker value={formData.end} onChange={(iso: string | null) => updateFormData('end', iso || '')} showTime={true} isEditable={isEditable} />}
                                </div>
                            </div>
                        </div>
                        <div className={styles.controlRow}>
                            <div className={styles.controlLabel}><FontAwesomeIcon icon={faCalendarDay} />하루 종일</div>
                            <div className={styles.controlContent}>
                                <div className={styles.switchControl}>
                                    <label className={styles.switch}>
                                        <input type="checkbox" checked={!!formData.allDay} onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateFormData('allDay', e.target.checked)} disabled={!isEditable} />
                                        <span className={styles.slider}></span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className={styles.sectionDivider} />

                    <div className={styles.controlSection}>
                        <div className={styles.controlRow}>
                            <div className={styles.controlLabel}><FontAwesomeIcon icon={faSync} />반복</div>
                            <div className={styles.controlContent}>
                                <div className={styles.switchControl}>
                                    <label className={styles.switch}>
                                        <input type="checkbox" checked={isRecurrenceEnabled} onChange={(e: React.ChangeEvent<HTMLInputElement>) => isEditable && setRecurrenceEnabled(e.target.checked)} disabled={!isEditable} />
                                        <span className={styles.slider}></span>
                                    </label>
                                </div>
                            </div>
                        </div>
                        {isRecurrenceEnabled && (
                            <div className={styles.recurrenceEditorWrapper}>
                                <RecurrenceEditor rruleString={formData.rrule} onChange={handleRecurrenceChange} startDate={formData.start} modalKey={modalKey} isEditable={isEditable} />
                            </div>
                        )}
                    </div>

                    <div className={styles.sectionDivider} />
                    <div className={styles.controlSection}>
                        <div className={styles.controlRow}>
                            <div className={styles.controlLabel}><FontAwesomeIcon icon={faPalette} />테마 색상</div>
                            <div className={styles.controlContent}>
                                <div className={styles.colorPalette}>
                                    {colorPalette.map(color => (
                                        <button
                                            key={color}
                                            type="button"
                                            className={`${styles.colorSwatch} ${formData.color === color ? styles.active : ''}`}
                                            style={{ backgroundColor: color }}
                                            onClick={() => updateFormData('color', color)}
                                            disabled={!isEditable}
                                        >
                                            {formData.color === color && <FontAwesomeIcon icon={faCheck} />}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className={styles.sectionDivider} />

                    <div className={styles.todoSection}>
                        <div className={styles.textareaLabel}>
                            <FontAwesomeIcon icon={faTasks} />
                            <span>To-Do List ({formData.tasks?.length || 0})</span>
                        </div>
                        <div className={styles.todoListContainer}>
                            <ul className={styles.todoList}>
                                {(formData.tasks || []).map((task: EventTask) => (
                                    <TaskItem
                                        key={task.id}
                                        task={task}
                                        onUpdate={handleUpdateTask}
                                        onDelete={handleDeleteTask}
                                        isEditable={isEditable}
                                    />
                                ))}
                            </ul>
                        </div>
                        {isEditable &&
                            <button onClick={handleAddTask} className={styles.addTaskButton}>
                                <FontAwesomeIcon icon={faPlus} /> 할 일 추가
                            </button>
                        }
                    </div>

                    <div className={styles.sectionDivider} />

                    <div className={styles.textareaGroup}>
                        <label htmlFor='description' className={styles.textareaLabel}>
                            <FontAwesomeIcon icon={faAlignLeft} />
                            <span>설명</span>
                        </label>
                        <textarea id="description" value={formData.description || ''} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => updateFormData('description', e.target.value)} className={styles.textarea} placeholder="설명 및 메모 추가..." disabled={!isEditable} />
                    </div>
                </main>

                <footer className={styles.footer}>
                    {isEditable ? (
                        <>
                            {!String(formData.id).startsWith('temp-') ? (
                                <button onClick={handleDelete} className={styles.deleteButton}>삭제</button>
                            ) : <div />}
                            <div style={{ flexGrow: 1 }} />
                            <div className={styles.actionButtons}>
                                <button onClick={handleClose} className={`${styles.button} ${styles.cancelButton}`}>
                                    취소
                                </button>
                                <button onClick={handleSave} className={`${styles.button} ${styles.saveButton}`}>저장</button>
                            </div>
                        </>
                    ) : (
                        <>
                            <div style={{ flexGrow: 1 }} />
                            <div className={styles.actionButtons}>
                                <button onClick={handleClose} className={`${styles.button} ${styles.cancelButton}`}>
                                    닫기
                                </button>
                            </div>
                        </>
                    )}
                </footer>
            </div>
        </div>
    );
};
export default EventEditorModal;