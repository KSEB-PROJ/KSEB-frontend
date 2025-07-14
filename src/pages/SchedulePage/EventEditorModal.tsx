import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faClock, faSync, faMapMarkerAlt, faAlignLeft, faCalendarDay, faTimes,
  faSignature, faPlus, faTrash, faTasks,
} from '@fortawesome/free-solid-svg-icons';
import type { ScheduleEvent, EventTask } from './types';
import styles from './EventEditorModal.module.css';
import RecurrenceEditor from './RecurrenceEditor';
import DatePicker from '../../components/date-picker/DatePicker';

interface Props {
  event: ScheduleEvent | null;
  onClose: () => void;
  onSave: (event: ScheduleEvent) => void;
  onDelete: (eventId: string) => void;
}

const TaskItem: React.FC<{
  task: EventTask;
  onUpdate: (field: keyof EventTask, value: EventTask[keyof EventTask]) => void;
  onDelete: () => void;
}> = ({ task, onUpdate, onDelete }) => {
  const statuses: EventTask['status'][] = ['TODO', 'DOING', 'DONE'];

  return (
    <li className={styles.taskItem}>
      <div className={styles.statusPillGroup}>
        {statuses.map(status => (
          <button
            key={status}
            data-status={status}
            className={`${styles.statusPill} ${task.status === status ? styles.active : ''}`}
            onClick={() => onUpdate('status', status)}
          >
            {status === 'TODO' && '할 일'}
            {status === 'DOING' && '진행중'}
            {status === 'DONE' && '완료'}
          </button>
        ))}
      </div>
      <input
        type="text"
        value={task.title}
        onChange={(e) => onUpdate('title', e.target.value)}
        className={styles.taskTitleInput}
        placeholder="할 일 내용 입력..."
      />
      <div className={styles.taskDueDate}>
        <DatePicker value={task.dueDate} onChange={(date) => onUpdate('dueDate', date)} showTime />
      </div>
      <button onClick={onDelete} className={styles.deleteTaskButton} title="삭제">
        <FontAwesomeIcon icon={faTrash} />
      </button>
    </li>
  );
};


const EventEditorModal: React.FC<Props> = ({ event, onClose, onSave, onDelete }) => {
  const [formData, setFormData] = useState<ScheduleEvent | null>(null);
  const [isRecurrenceEnabled, setRecurrenceEnabled] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  const modalKey = useMemo(() => (event?.id || 'new') + '-' + Date.now(), [event]);

  useEffect(() => {
    setFormData(event ? { ...event, tasks: event.tasks || [] } : null);
    setRecurrenceEnabled(!!event?.rrule);
  }, [event]);

  const updateFormData = useCallback((field: keyof ScheduleEvent, value: ScheduleEvent[keyof ScheduleEvent]) => {
    setFormData((prev) => (prev ? { ...prev, [field]: value } : null));
  }, []);

  const handleAddTask = () => {
    if (!formData) return;
    const newTask: EventTask = {
      id: Date.now(),
      eventId: formData.id,
      title: '',
      status: 'TODO',
      dueDate: null,
    };
    updateFormData('tasks', [...(formData.tasks || []), newTask]);
  };

  const handleUpdateTask = (taskId: number, field: keyof EventTask, value: EventTask[keyof EventTask]) => {
    if (!formData || !formData.tasks) return;
    const updatedTasks = formData.tasks.map(task =>
      task.id === taskId ? { ...task, [field]: value } : task
    );
    updateFormData('tasks', updatedTasks);
  };

  const handleDeleteTask = (taskId: number) => {
    if (!formData || !formData.tasks) return;
    const filteredTasks = formData.tasks.filter(task => task.id !== taskId);
    updateFormData('tasks', filteredTasks);
  };

  const handleRecurrenceToggle = (enabled: boolean) => {
    setRecurrenceEnabled(enabled);
    if (!enabled) updateFormData('rrule', undefined);
  };

  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(onClose, 300);
  }, [onClose]);

  const handleSave = () => {
    if (formData && formData.title.trim()) {
      onSave(formData);
      handleClose();
    } else {
      alert('일정 제목을 입력해주세요.');
    }
  };

  const handleDelete = () => {
    const eventIdToDelete = formData?.originalId || formData?.id;
    if (eventIdToDelete && window.confirm('이 일정을 정말 삭제하시겠습니까?')) {
      onDelete(eventIdToDelete);
      handleClose();
    }
  };

  if (!formData) return null;
  const modalContainerClass = `${styles.modalContainer} ${isClosing ? styles.closing : ''}`;

  return (
    <div className={`${styles.overlay} ${isClosing ? styles.closing : ''}`} onClick={handleClose}>
      <div className={modalContainerClass} onClick={(e) => e.stopPropagation()}>

        <header className={styles.header}>
          <h2>{String(formData.id).startsWith('temp-') ? '새 일정 추가' : '일정 편집'}</h2>
          <button className={styles.closeButton} onClick={handleClose}><FontAwesomeIcon icon={faTimes} /></button>
        </header>

        <main className={styles.content}>
          <div className={styles.inputGroup}>
            <input id="title" type="text" value={formData.title} onChange={(e) => updateFormData('title', e.target.value)} placeholder=" " autoFocus />
            <label htmlFor="title"><FontAwesomeIcon icon={faSignature} /> 일정 제목</label>
          </div>
          <div className={styles.inputGroup}>
            <input id="location" type="text" value={formData.location || ''} onChange={(e) => updateFormData('location', e.target.value)} placeholder=" " />
            <label htmlFor='location'><FontAwesomeIcon icon={faMapMarkerAlt} /> 장소 또는 링크</label>
          </div>

          <div className={styles.sectionDivider} />

          <div className={styles.controlSection}>
            <div className={styles.controlRow}>
              <div className={styles.controlLabel}><FontAwesomeIcon icon={faClock} />시간</div>
              <div className={styles.controlContent}>
                <div className={styles.datePickerGroup}>
                  <DatePicker
                    value={formData.start}
                    onChange={(iso) => updateFormData('start', iso || '')}
                    showTime={!formData.allDay}
                  />
                  {!formData.allDay && <span className={styles.timeSeparator}>~</span>}
                  {!formData.allDay && (
                    <DatePicker
                      value={formData.end}
                      onChange={(iso) => updateFormData('end', iso || '')}
                      showTime={true}
                    />
                  )}
                </div>
              </div>
            </div>
            <div className={styles.controlRow}>
              <div className={styles.controlLabel}><FontAwesomeIcon icon={faCalendarDay} />하루 종일</div>
              <div className={styles.controlContent}>
                <div className={styles.switchControl}>
                  <label className={styles.switch}>
                    <input type="checkbox" checked={!!formData.allDay} onChange={e => updateFormData('allDay', e.target.checked)} />
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
                    <input type="checkbox" checked={isRecurrenceEnabled} onChange={e => handleRecurrenceToggle(e.target.checked)} />
                    <span className={styles.slider}></span>
                  </label>
                </div>
              </div>
            </div>
            {isRecurrenceEnabled && (
              <div className={styles.recurrenceEditorWrapper}>
                <RecurrenceEditor
                  rruleString={formData.rrule}
                  onChange={(rrule) => updateFormData('rrule', rrule)}
                  startDate={formData.start}
                  modalKey={modalKey}
                />
              </div>
            )}
          </div>

          <div className={styles.sectionDivider} />

          <div className={styles.todoSection}>
            <div className={styles.textareaLabel}>
              <FontAwesomeIcon icon={faTasks} />
              <span>To-Do List</span>
            </div>
            <ul className={styles.todoList}>
              {(formData.tasks || []).map(task => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onUpdate={(field, value) => handleUpdateTask(task.id, field, value)}
                  onDelete={() => handleDeleteTask(task.id)}
                />
              ))}
            </ul>
            <button onClick={handleAddTask} className={styles.addTaskButton}>
              <FontAwesomeIcon icon={faPlus} /> 할 일 추가
            </button>
          </div>

          <div className={styles.sectionDivider} />

          <div className={styles.textareaGroup}>
            <label htmlFor='description' className={styles.textareaLabel}>
              <FontAwesomeIcon icon={faAlignLeft} />
              <span>설명</span>
            </label>
            <textarea id="description" value={formData.description || ''} onChange={(e) => updateFormData('description', e.target.value)} className={styles.textarea} placeholder="설명 및 메모 추가..." />
          </div>
        </main>

        <footer className={styles.footer}>
          {!String(formData.id).startsWith('temp-') && (
            <button onClick={handleDelete} className={styles.deleteButton}>삭제</button>
          )}
          <div style={{ flexGrow: 1 }} />
          <div className={styles.actionButtons}>
            <button onClick={handleClose} className={`${styles.button} ${styles.cancelButton}`}>취소</button>
            <button onClick={handleSave} className={`${styles.button} ${styles.saveButton}`}>저장</button>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default EventEditorModal;