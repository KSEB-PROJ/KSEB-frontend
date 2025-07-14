import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faClock,
  faSync,
  faMapMarkerAlt,
  faAlignLeft,
  faCalendarDay,
} from '@fortawesome/free-solid-svg-icons';
import type { ScheduleEvent } from './types';
import styles from './EventEditorModal.module.css';
import RecurrenceEditor from './RecurrenceEditor';
import DatePicker from '../../components/date-picker/DatePicker';

interface Props {
  event: ScheduleEvent | null;
  onClose: () => void;
  onSave: (event: ScheduleEvent) => void;
  onDelete: (eventId: string) => void;
}

const EventEditorModal: React.FC<Props> = ({
  event,
  onClose,
  onSave,
  onDelete,
}) => {
  const [formData, setFormData] = useState<ScheduleEvent | null>(null);
  const [isRecurrenceEnabled, setRecurrenceEnabled] = useState(false);

  const modalKey = useMemo(() => {
    return (event?.id || 'new') + '-' + Date.now();
  }, [event]);

  useEffect(() => {
    setFormData(event);
    setRecurrenceEnabled(!!event?.rrule);
  }, [event]);

  const updateFormData = useCallback(
    (field: keyof ScheduleEvent, value: ScheduleEvent[keyof ScheduleEvent]) => {
      setFormData((prev) => (prev ? { ...prev, [field]: value } : null));
    },
    []
  );

  const handleRecurrenceToggle = (enabled: boolean) => {
    setRecurrenceEnabled(enabled);
    if (!enabled) {
      updateFormData('rrule', undefined);
    }
  };
  
  if (!formData) return null;

  const handleSave = () => {
    if (formData && formData.title.trim()) {
      onSave(formData);
    } else {
      alert('일정 제목을 입력해주세요.');
    }
  };

  const handleDelete = () => {
    if (formData && window.confirm('이 일정을 정말 삭제하시겠습니까?')) {
      onDelete(formData.id);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modalContainer} onClick={(e) => e.stopPropagation()}>
        
        <div className={styles.mainGrid}>
            <div className={styles.contentColumn}>
                <div className={styles.formModule}>
                    <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => updateFormData('title', e.target.value)}
                        placeholder="일정 제목"
                        className={styles.titleInput}
                        autoFocus
                    />
                </div>
                 <div className={styles.formModule} style={{flexGrow: 1}}>
                    <label className={styles.label}><FontAwesomeIcon icon={faAlignLeft}/> 설명</label>
                    <textarea
                        value={formData.description || ''}
                        onChange={(e) => updateFormData('description', e.target.value)}
                        className={styles.textarea}
                        placeholder="설명 및 메모 추가..."
                    />
                </div>
            </div>

            <div className={styles.controlsColumn}>
                <div className={styles.formModule}>
                    <label className={styles.label}><FontAwesomeIcon icon={faClock}/> 시간</label>
                     <DatePicker
                        value={formData.start}
                        onChange={(iso) => updateFormData('start', iso || '')}
                        showTime={!formData.allDay}
                    />
                    {!formData.allDay && (
                        <DatePicker
                            value={formData.end}
                            onChange={(iso) => updateFormData('end', iso || '')}
                            showTime={true}
                        />
                    )}
                     <div className={styles.switchRow}>
                        <label className={styles.label}><FontAwesomeIcon icon={faCalendarDay}/> 하루 종일</label>
                        <label className={styles.switch}>
                            <input type="checkbox" checked={formData.allDay} onChange={e => updateFormData('allDay', e.target.checked)} />
                            <span className={styles.slider}></span>
                        </label>
                    </div>
                </div>

                <div className={styles.formModule}>
                    <label className={styles.label}><FontAwesomeIcon icon={faMapMarkerAlt}/> 장소 또는 링크</label>
                    <input
                      type="text"
                      value={formData.location || ''}
                      onChange={(e) => updateFormData('location', e.target.value)}
                      className={styles.input}
                    />
                </div>
                
                <div className={styles.formModule}>
                     <div className={styles.switchRow}>
                        <label className={styles.label}><FontAwesomeIcon icon={faSync}/> 반복</label>
                        <label className={styles.switch}>
                            <input type="checkbox" checked={isRecurrenceEnabled} onChange={e => handleRecurrenceToggle(e.target.checked)} />
                            <span className={styles.slider}></span>
                        </label>
                    </div>
                    {isRecurrenceEnabled && (
                        <RecurrenceEditor
                            rruleString={formData.rrule}
                            onChange={(rrule) => updateFormData('rrule', rrule)}
                            startDate={formData.start}
                            modalKey={modalKey}
                        />
                    )}
                </div>
            </div>
        </div>

        <footer className={styles.footer}>
          {!String(formData.id).startsWith('temp-') && (
            <button onClick={handleDelete} className={styles.deleteButton}>
              삭제
            </button>
          )}
          <div style={{ flexGrow: 1 }} />
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