import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faClock, faSync, faMapMarkerAlt, faAlignLeft, faCalendarDay, faTimes,
    faSignature, faPlus, faTrash, faTasks, faLock, faUsers, faCheckCircle,
    faTimesCircle, faQuestionCircle, faPalette, faLayerGroup, faCheck
} from '@fortawesome/free-solid-svg-icons';
import type { ScheduleEvent, EventTask, EventParticipant } from './types';
import styles from './EventEditorModal.module.css';
import RecurrenceEditor from './RecurrenceEditor';
import DatePicker from '../../components/date-picker/DatePicker';

// --- 색상 팔레트 옵션 ---
const colorPalette = [
    '#8400ff', '#14d6ae', '#ec4899', '#3b82f6',
    '#f97316', '#22c55e', '#eab308', '#06b6d4',
    '#ef4444', '#6366f1', '#a855f7', '#10b981'
];
// [추가] 현재 사용자 ID (임시 Mock 데이터)
const CURRENT_USER_ID = 123;

// TaskItem 컴포넌트 로직
const TaskItem: React.FC<{
    task: EventTask;
    onUpdate: (field: keyof EventTask, value: EventTask[keyof EventTask]) => void;
    onDelete: () => void;
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
            onUpdate('title', textRef.current.innerText);
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
                        onClick={() => onUpdate('status', status)}
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
                onKeyDown={(e) => {
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
                <DatePicker value={task.dueDate} onChange={(date) => onUpdate('dueDate', date)} showTime isEditable={isEditable} />
            </div>
            <button onClick={onDelete} className={styles.deleteTaskButton} title="삭제" disabled={!isEditable}>
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
}> = ({ event, onClose, onSave, onDelete }) => {
    const [formData, setFormData] = useState<ScheduleEvent | null>(null);
    const [isRecurrenceEnabled, setRecurrenceEnabled] = useState(false);
    const [isClosing, setIsClosing] = useState(false);

    const isEditable = useMemo(() => formData?.isEditable ?? false, [formData]);
    const modalKey = useMemo(() => (event?.id || 'new') + '-' + Date.now(), [event]);

    useEffect(() => {
        if (event) {
            setFormData({ ...event, color: event.color || colorPalette[0] });
        } else {
            setFormData(null);
        }
        setRecurrenceEnabled(!!event?.rrule);
    }, [event]);

    const handleClose = useCallback(() => {
        setIsClosing(true);
        setTimeout(onClose, 300);
    }, [onClose]);

    const updateFormData = useCallback((field: keyof ScheduleEvent, value: ScheduleEvent[keyof ScheduleEvent]) => {
        // [수정] 일정 수정은 isEditable, 참가 상태 변경은 항상 가능하도록 조건 변경
        if (!isEditable && field !== 'participants') return;
        setFormData((prev) => (prev ? { ...prev, [field]: value } : null));
    }, [isEditable]);

    const handleSave = () => {
        if (!formData) return;
        // [수정] 참가 상태만 변경하는 경우도 저장 가능하도록, isEditable 체크는 title 검증에만 적용
        if (isEditable && !formData.title.trim()) {
            alert('일정 제목을 입력해주세요.');
            return;
        }
        onSave(formData);
    };

    const handleDelete = () => {
        if (!isEditable || !formData) return;
        const originalId = formData.id.startsWith('event-') ? formData.id.split('-').slice(0, 3).join('-') : formData.id;
        onDelete(originalId);
    };
    
    // 👇 [신규] 현재 유저의 참석 상태를 변경하는 함수
    const handleParticipantStatusChange = (newStatus: EventParticipant['status']) => {
        if (!formData) return;
        const updatedParticipants = formData.participants?.map(p => 
            p.userId === CURRENT_USER_ID ? { ...p, status: newStatus } : p
        );
        updateFormData('participants', updatedParticipants);
    };

    const handleAddTask = () => {
        if (!formData || !isEditable) return;
        const newTask: EventTask = { id: Date.now(), eventId: formData.id, title: '', status: 'TODO', dueDate: null };
        updateFormData('tasks', [...(formData.tasks || []), newTask]);
    };

    const handleUpdateTask = (taskId: number, field: keyof EventTask, value: EventTask[keyof EventTask]) => {
        if (!formData || !isEditable) return;
        const updatedTasks = formData.tasks?.map(t => t.id === taskId ? { ...t, [field]: value } : t);
        updateFormData('tasks', updatedTasks);
    };

    const handleDeleteTask = (taskId: number) => {
        if (!formData || !isEditable) return;
        const filteredTasks = formData.tasks?.filter(t => t.id !== taskId);
        updateFormData('tasks', filteredTasks);
    };

    const ParticipantStatusIcon = ({ status }: { status: EventParticipant['status'] }) => {
        const iconMap = {
            'ACCEPTED': { icon: faCheckCircle, className: styles.statusAccepted, title: "참석" },
            'DECLINED': { icon: faTimesCircle, className: styles.statusDeclined, title: "거절" },
            'TENTATIVE': { icon: faQuestionCircle, className: styles.statusTentative, title: "미정" }
        };
        const { icon, className, title } = iconMap[status];
        return <FontAwesomeIcon icon={icon} className={className} title={title} />;
    };

    if (!formData) return null;

    // 👇 [신규] 현재 유저의 참석 상태를 찾음
    const currentUserStatus = formData.participants?.find(p => p.userId === CURRENT_USER_ID)?.status;

    return (
        <div className={`${styles.overlay} ${isClosing ? styles.closing : ''}`} onClick={handleClose}>
            <div
                className={`${styles.modalContainer} ${isClosing ? styles.closing : ''}`}
                onClick={(e) => e.stopPropagation()}
                style={{ '--event-theme-color': formData.color } as React.CSSProperties}
            >

                <header className={styles.header}>
                    <h2>{String(formData.id).startsWith('temp-') ? '새 일정 추가' : '일정 정보'}</h2>
                    {!isEditable && !formData.groupName && <div className={styles.readOnlyBadge}><FontAwesomeIcon icon={faLock} /> 읽기 전용</div>}
                    {formData.ownerType === 'GROUP' && formData.groupName && (
                        <div className={styles.groupInfoBadge}>
                            <FontAwesomeIcon icon={faLayerGroup} />
                            <span>{formData.groupName}</span>
                        </div>
                    )}
                    <button className={styles.closeButton} onClick={handleClose}><FontAwesomeIcon icon={faTimes} /></button>
                </header>

                <main className={styles.content}>
                    <div className={styles.inputGroup}>
                        <input id="title" type="text" value={formData.title} onChange={(e) => updateFormData('title', e.target.value)} placeholder=" " autoFocus disabled={!isEditable} />
                        <label htmlFor="title"><FontAwesomeIcon icon={faSignature} /> 일정 제목</label>
                    </div>
                    <div className={styles.inputGroup}>
                        <input id="location" type="text" value={formData.location || ''} onChange={(e) => updateFormData('location', e.target.value)} placeholder=" " disabled={!isEditable} />
                        <label htmlFor='location'><FontAwesomeIcon icon={faMapMarkerAlt} /> 장소 또는 링크</label>
                    </div>

                    {/* 👇 [수정] 그룹 일정일 때만 참가자 및 참석 여부 UI 표시 */}
                    {formData.ownerType === 'GROUP' && (
                        <>
                            <div className={styles.sectionDivider} />
                            <div className={styles.participantSection}>
                                <div className={styles.textareaLabel}>
                                    <FontAwesomeIcon icon={faUsers} />
                                    <span>참여자 ({formData.participants?.length || 0})</span>
                                </div>
                                <ul className={styles.participantList}>
                                    {formData.participants?.map(p => (
                                        <li key={p.userId}>
                                            <ParticipantStatusIcon status={p.status} />
                                            <span>{p.userName}</span>
                                        </li>
                                    ))}
                                </ul>
                                {/* [신규] 참석 여부 선택 버튼 UI */}
                                <div className={styles.statusButtonsContainer}>
                                    <button
                                        className={`${styles.statusButton} ${currentUserStatus === 'ACCEPTED' ? styles.activeStatus : ''}`}
                                        onClick={() => handleParticipantStatusChange('ACCEPTED')}
                                        data-status="accepted"
                                    >
                                        <FontAwesomeIcon icon={faCheckCircle} /> 참석
                                    </button>
                                    <button
                                        className={`${styles.statusButton} ${currentUserStatus === 'TENTATIVE' ? styles.activeStatus : ''}`}
                                        onClick={() => handleParticipantStatusChange('TENTATIVE')}
                                        data-status="tentative"
                                    >
                                        <FontAwesomeIcon icon={faQuestionCircle} /> 미정
                                    </button>
                                    <button
                                        className={`${styles.statusButton} ${currentUserStatus === 'DECLINED' ? styles.activeStatus : ''}`}
                                        onClick={() => handleParticipantStatusChange('DECLINED')}
                                        data-status="declined"
                                    >
                                        <FontAwesomeIcon icon={faTimesCircle} /> 거절
                                    </button>
                                </div>
                            </div>
                        </>
                    )}

                    <div className={styles.sectionDivider} />

                    <div className={styles.controlSection}>
                        <div className={styles.controlRow}>
                            <div className={styles.controlLabel}><FontAwesomeIcon icon={faClock} />시간</div>
                            <div className={styles.controlContent}>
                                <div className={styles.datePickerGroup}>
                                    <DatePicker value={formData.start} onChange={(iso) => updateFormData('start', iso || '')} showTime={!formData.allDay} isEditable={isEditable} />
                                    {!formData.allDay && formData.end && <span className={styles.timeSeparator}>~</span>}
                                    {!formData.allDay && formData.end && <DatePicker value={formData.end} onChange={(iso) => updateFormData('end', iso || '')} showTime={true} isEditable={isEditable} />}
                                </div>
                            </div>
                        </div>
                        <div className={styles.controlRow}>
                            <div className={styles.controlLabel}><FontAwesomeIcon icon={faCalendarDay} />하루 종일</div>
                            <div className={styles.controlContent}>
                                <div className={styles.switchControl}>
                                    <label className={styles.switch}>
                                        <input type="checkbox" checked={!!formData.allDay} onChange={e => updateFormData('allDay', e.target.checked)} disabled={!isEditable} />
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
                                        <input type="checkbox" checked={isRecurrenceEnabled} onChange={e => isEditable && setRecurrenceEnabled(e.target.checked)} disabled={!isEditable} />
                                        <span className={styles.slider}></span>
                                    </label>
                                </div>
                            </div>
                        </div>
                        {isRecurrenceEnabled && (
                            <div className={styles.recurrenceEditorWrapper}>
                                <RecurrenceEditor rruleString={formData.rrule} onChange={(rrule) => updateFormData('rrule', rrule)} startDate={formData.start} modalKey={modalKey} isEditable={isEditable} />
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
                                {(formData.tasks || []).map(task => (
                                    <TaskItem
                                        key={task.id}
                                        task={task}
                                        onUpdate={(field, value) => handleUpdateTask(task.id, field, value)}
                                        onDelete={() => handleDeleteTask(task.id)}
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
                        <textarea id="description" value={formData.description || ''} onChange={(e) => updateFormData('description', e.target.value)} className={styles.textarea} placeholder="설명 및 메모 추가..." disabled={!isEditable} />
                    </div>
                </main>

                <footer className={styles.footer}>
                    {(isEditable && !String(formData.id).startsWith('temp-')) ? (
                        <button onClick={handleDelete} className={styles.deleteButton}>삭제</button>
                    ) : <div></div>}
                    <div style={{ flexGrow: 1 }} />
                    <div className={styles.actionButtons}>
                        <button onClick={handleClose} className={`${styles.button} ${styles.cancelButton}`}>
                            취소
                        </button>
                        <button onClick={handleSave} className={`${styles.button} ${styles.saveButton}`}>저장</button>
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default EventEditorModal;