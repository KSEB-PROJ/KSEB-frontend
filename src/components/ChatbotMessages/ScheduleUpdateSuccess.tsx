import React from 'react';
import styles from './ChatMessage.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPenToSquare } from '@fortawesome/free-solid-svg-icons';
import dayjs from 'dayjs';
import { useEventStore } from '../../stores/eventStore';

interface ScheduleUpdateSuccessProps {
  data: {
    eventId: number;
    updated_fields: {
        title?: string;
        startDatetime?: string;
        endDatetime?: string;
    };
  };
}

const ScheduleUpdateSuccess: React.FC<ScheduleUpdateSuccessProps> = ({ data }) => {
  const { updated_fields, eventId } = data;
  const { openModal, events } = useEventStore();

  const handleClick = () => {
    const eventToOpen = events.find(event => Number(event.id) === eventId);
    if (eventToOpen) {
      // 챗봇에서 열 때는 항상 읽기 전용으로 설정
      openModal({ ...eventToOpen, isEditable: false });
    } else {
      console.warn(`Event with ID ${eventId} not found in the store.`);
      // 또는 사용자에게 이벤트가 삭제되었거나 찾을 수 없다는 알림을 표시.
    }
  };

  return (
    <div className={styles.customMessageContainer} onClick={handleClick} style={{ cursor: 'pointer' }}>
      <div 
        className={styles.scheduleListItem} 
        style={{'--event-color': '#f97316'} as React.CSSProperties}
      >
        <div className={styles.eventColorLine}></div>
        <div className={styles.eventContent}>
          <div className={styles.eventTime}>
            {updated_fields.startDatetime ? dayjs(updated_fields.startDatetime).format('HH:mm') : '시간'}
            {updated_fields.endDatetime ? ' - ' + dayjs(updated_fields.endDatetime).format('HH:mm') : ''}
          </div>
          <div className={styles.eventDetails}>
            <FontAwesomeIcon icon={faPenToSquare} className={styles.eventIcon} />
            <span className={styles.eventTitle}>{updated_fields.title || '일정 수정됨'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScheduleUpdateSuccess;
