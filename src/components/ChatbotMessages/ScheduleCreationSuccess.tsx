import React from 'react';
import styles from './ChatMessage.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarCheck } from '@fortawesome/free-solid-svg-icons';
import dayjs from 'dayjs';
import { useEventStore } from '../../stores/eventStore';
import type { ScheduleEvent } from '../../types';

interface ScheduleCreationSuccessProps {
  schedule: Partial<ScheduleEvent>;
}

const ScheduleCreationSuccess: React.FC<ScheduleCreationSuccessProps> = ({ schedule }) => {
  const { openModal } = useEventStore();

  const handleClick = () => {
    // Partial<ScheduleEvent>를 완전한 ScheduleEvent로 안전하게 변환
    const eventForModal: ScheduleEvent = {
      id: schedule.id || `temp-${Date.now()}`,
      title: schedule.title || '제목 없음',
      start: schedule.start ? dayjs(schedule.start).toISOString() : new Date().toISOString(),
      end: schedule.end ? dayjs(schedule.end).toISOString() : new Date().toISOString(),
      allDay: schedule.allDay || false,
      ownerType: schedule.ownerType || 'USER',
      ownerId: schedule.ownerId || 0,
      color: schedule.color || '#22c55e',
      isEditable: false, // 챗봇에서 생성 직후에는 읽기 전용으로 보여줌
      description: schedule.description,
      location: schedule.location,
      rrule: schedule.rrule,
      participants: schedule.participants || [],
      tasks: schedule.tasks || [],
      createdBy: schedule.createdBy || 0,
    };
    openModal(eventForModal);
  };

  return (
    <div className={styles.customMessageContainer}>
      <div 
        className={styles.scheduleListItem} 
        style={{'--event-color': schedule.color || '#22c55e'} as React.CSSProperties}
        onClick={handleClick}
        title="클릭하여 일정 수정"
      >
        <div className={styles.eventColorLine}></div>
        <div className={styles.eventContent}>
          <div className={styles.eventTime}>
            {schedule.start && schedule.end ? dayjs(schedule.start).format('HH:mm') + ' - ' + dayjs(schedule.end).format('HH:mm') : '시간 정보 없음'}
          </div>
          <div className={styles.eventDetails}>
            <FontAwesomeIcon icon={faCalendarCheck} className={styles.eventIcon} />
            <span className={styles.eventTitle}>{schedule.title}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScheduleCreationSuccess;
