import React, { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faTimes } from '@fortawesome/free-solid-svg-icons';
import type { ScheduleEvent } from './types';
import styles from './EventEditorModal.module.css';
import RecurrenceEditor from './RecurrenceEditor';

interface Props {
  event: ScheduleEvent | null;
  onClose: () => void;
  onSave: (event: ScheduleEvent) => void;
  onDelete: (eventId: string) => void;
}

const EventEditorModal: React.FC<Props> = ({ event, onClose, onSave, onDelete }) => {
  const [formData, setFormData] = useState<ScheduleEvent | null>(null);

  useEffect(() => {
    setFormData(event);
  }, [event]);

  if (!formData) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const isChecked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;
    setFormData(prev => {
      if (!prev) return null;
      if (name === 'allDay' && isChecked) {
        return {
          ...prev,
          allDay: isChecked,
          start: dayjs(prev.start).startOf('day').format('YYYY-MM-DD'),
          end: dayjs(prev.end).endOf('day').format('YYYY-MM-DD')
        };
      }
      return { ...prev, [name]: isChecked !== undefined ? isChecked : value };
    });
  };

  const handleRecurrenceChange = (rrule: string | undefined) => {
    setFormData(prev => prev ? { ...prev, rrule } : null);
  };

  const handleSave = () => {
    if (formData) {
      const finalData = {
        ...formData,
        start: dayjs(formData.start).format(formData.allDay ? 'YYYY-MM-DD' : 'YYYY-MM-DDTHH:mm'),
        end: dayjs(formData.end).format(formData.allDay ? 'YYYY-MM-DD' : 'YYYY-MM-DDTHH:mm'),
      };
      onSave(finalData);
    }
  };

  const handleDelete = () => {
    if (window.confirm('이 일정을 정말 삭제하시겠습니까?')) {
      onDelete(formData.id);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modalContainer} onClick={e => e.stopPropagation()}>
        <header className={styles.header}>
          <h2>{String(formData.id).startsWith('temp-') ? '새로운 일정' : '일정 수정'}</h2>
          <button className={styles.closeButton} onClick={onClose}>
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </header>
        <main className={styles.content}>
          <div className={styles.inputGroup}>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="일정 제목"
              className={styles.input}
              style={{ fontSize: '1.2rem', fontWeight: 'bold' }}
            />
          </div>
          <div className={styles.timeGroup}>
            <div className={styles.inputGroup} style={{ flex: 1 }}>
              <label className={styles.label}>시작</label>
              <input
                type={formData.allDay ? 'date' : 'datetime-local'}
                name="start"
                value={dayjs(formData.start).format(formData.allDay ? 'YYYY-MM-DD' : 'YYYY-MM-DDTHH:mm')}
                onChange={handleChange}
                className={styles.input}
              />
            </div>
            <div className={styles.inputGroup} style={{ flex: 1 }}>
              <label className={styles.label}>종료</label>
              <input
                type={formData.allDay ? 'date' : 'datetime-local'}
                name="end"
                value={dayjs(formData.end).format(formData.allDay ? 'YYYY-MM-DD' : 'YYYY-MM-DDTHH:mm')}
                onChange={handleChange}
                className={styles.input}
              />
            </div>
          </div>
          <label className={styles.checkboxGroup}>
            <input
              type="checkbox"
              name="allDay"
              checked={formData.allDay}
              onChange={handleChange}
              className={styles.checkboxInput}
            />
            <span className={styles.checkboxStyled}>
              <FontAwesomeIcon icon={faCheck} />
            </span>
            <span>하루 종일</span>
          </label>
          <div className={styles.inputGroup}>
            <label className={styles.label}>반복 설정</label>
            <RecurrenceEditor
              rruleString={formData.rrule}
              onChange={handleRecurrenceChange}
              startDate={formData.start}
            />
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.label}>장소 또는 링크</label>
            <input
              type="text"
              name="location"
              value={formData.location || ''}
              onChange={handleChange}
              className={styles.input}
            />
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.label}>설명</label>
            <textarea
              name="description"
              value={formData.description || ''}
              onChange={handleChange}
              className={styles.textarea}
            />
          </div>
        </main>
        <footer className={styles.footer}>
          {!String(formData.id).startsWith('temp-') && (
            <button onClick={handleDelete} className={styles.deleteButton}>
              삭제
            </button>
          )}
          <div className={styles.actionButtons}>
            <button onClick={onClose} className={`${styles.button} ${styles.cancelButton}`}>
              취소
            </button>
            <button onClick={handleSave} className={`${styles.button} ${styles.saveButton}`}>
              저장
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default EventEditorModal;
