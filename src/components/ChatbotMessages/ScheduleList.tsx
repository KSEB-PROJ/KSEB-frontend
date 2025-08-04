// 챗봇의 일정 목록 답변을 표시하는 컴포넌트.
import React from 'react';
import { useEventStore } from '../../stores/eventStore';
import { transformToScheduleEvent } from '../../api/events';
import type { BackendEventResponse } from '../../types/events';
import styles from './ChatMessage.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarCheck, faClock } from '@fortawesome/free-solid-svg-icons';

interface ScheduleListProps {
  data: BackendEventResponse[];
}

const ScheduleList: React.FC<ScheduleListProps> = ({ data }) => {
  const { openModal, groups } = useEventStore();

  if (!data || data.length === 0) {
    return <p>조회된 일정이 없습니다.</p>;
  }

  const handleEventClick = (event: BackendEventResponse) => {
    const scheduleEvent = transformToScheduleEvent(event, groups);
    // 챗봇에서 열 때는 항상 읽기 전용으로 설정
    openModal({ ...scheduleEvent, isEditable: false });
  };

  return (
    <div className={styles.customMessageContainer}>
      <h4 className={styles.customMessageHeader}>
        <FontAwesomeIcon icon={faCalendarCheck} /> 일정 조회 결과
      </h4>
      <ul className={styles.scheduleList}>
        {data.map((event) => (
          <li 
            key={event.eventId} 
            onClick={() => handleEventClick(event)}
            className={styles.scheduleListItem}
            style={{'--event-color': event.themeColor} as React.CSSProperties}
          >
            <div className={styles.eventColorLine}></div>
            <div className={styles.eventContent}>
                <div className={styles.eventTime}>
                    {event.allDay 
                        ? '종일' 
                        : `${new Date(event.startDatetime).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false })} - ${new Date(event.endDatetime).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false })}`
                    }
                </div>
                <div className={styles.eventDetails}>
                    <FontAwesomeIcon icon={faClock} className={styles.eventIcon} />
                    <span className={styles.eventTitle}>{event.title}</span>
                </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ScheduleList;
