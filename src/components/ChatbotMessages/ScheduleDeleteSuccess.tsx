import React from 'react';
import styles from './ChatMessage.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrashCan } from '@fortawesome/free-solid-svg-icons';

interface ScheduleDeleteSuccessProps {
  data: {
    eventId: number;
    title: string;
  };
}

const ScheduleDeleteSuccess: React.FC<ScheduleDeleteSuccessProps> = ({ data }) => {
  return (
    <div className={styles.customMessageContainer}>
      <div 
        className={styles.scheduleListItem} 
        style={{'--event-color': '#ef4444', cursor: 'default'} as React.CSSProperties}
      >
        <div className={styles.eventColorLine}></div>
        <div className={styles.eventContent}>
          <div className={styles.eventTime} style={{textDecoration: 'line-through'}}>
            삭제됨
          </div>
          <div className={styles.eventDetails}>
            <FontAwesomeIcon icon={faTrashCan} className={styles.eventIcon} />
            <span className={styles.eventTitle} style={{textDecoration: 'line-through'}}>{data.title}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScheduleDeleteSuccess;
