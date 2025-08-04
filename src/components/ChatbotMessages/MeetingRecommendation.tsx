// 챗봇의 회의 시간 추천 답변을 표시하는 컴포넌트.
import React from 'react';
import { useChatbotStore } from '../../stores/chatbotStore';
import { useChannelStore } from '../../stores/channelStore';
import styles from './ChatMessage.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarPlus } from '@fortawesome/free-solid-svg-icons';
import dayjs from 'dayjs';
import 'dayjs/locale/ko';
dayjs.locale('ko');

interface Recommendation {
  start: string;
  end: string;
}

interface MeetingRecommendationProps {
  recommendations: Recommendation[];
}

const MeetingRecommendation: React.FC<MeetingRecommendationProps> = ({ recommendations }) => {
  const { sendMessage, isLoading } = useChatbotStore();
  const selectedChannel = useChannelStore((state) => state.selectedChannel);

  if (!recommendations || recommendations.length === 0) {
    return <p>추천할 시간이 없습니다.</p>;
  }

  const handleRecommendationClick = (slot: Recommendation) => {
    if (isLoading) return;
    
    const channelId = selectedChannel?.id || 0;
    const startTime = dayjs(slot.start).format('YYYY-MM-DD HH:mm');
    const endTime = dayjs(slot.end).format('HH:mm');
    
    const command = `${startTime}부터 ${endTime}까지 그룹 회의 일정 생성해줘`;
    
    sendMessage(command, channelId);
  };

  return (
    <div className={styles.customMessageContainer}>
      {/* 설명 텍스트를 컴포넌트 안으로 이동 */}
      <p>그룹 멤버들이 모두 가능한 회의 시간들을 찾았어요. 아래 시간 중에서 선택하여 일정을 생성해 보세요.</p>
      <div className={styles.recommendationGrid}>
        {recommendations.map((slot, index) => (
          <button 
            key={index} 
            className={styles.recommendationCard} 
            onClick={() => handleRecommendationClick(slot)}
            disabled={isLoading}
            title="이 시간으로 일정 생성"
          >
            <FontAwesomeIcon icon={faCalendarPlus} className={styles.recommendationIcon} />
            <div className={styles.slotDate}>
              {dayjs(slot.start).format('M월 D일 (ddd)')}
            </div>
            <div className={styles.slotTime}>
              {dayjs(slot.start).format('HH:mm')} - {dayjs(slot.end).format('HH:mm')}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default MeetingRecommendation;
