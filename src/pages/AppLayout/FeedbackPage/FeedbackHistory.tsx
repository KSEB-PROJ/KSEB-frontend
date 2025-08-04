import React from 'react';
import styles from './FeedbackHistory.module.css';
import FeedbackPreviewCard from './FeedbackPreviewCard';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';

// 임시 데이터
const mockHistory = [
  { id: 1, title: '1차 발표 피드백', date: '2025-08-03', thumbnailUrl: 'https://via.placeholder.com/300x169/FF0000/FFFFFF?text=Video1', overallScore: 72, scores: [{ subject: '표정', value: 80 }, { subject: '동작', value: 60 }, { subject: '말투', value: 75 }] },
  { id: 2, title: '프로젝트 중간 발표', date: '2025-07-28', thumbnailUrl: 'https://via.placeholder.com/300x169/00FF00/FFFFFF?text=Video2', overallScore: 85, scores: [{ subject: '표정', value: 90 }, { subject: '동작', value: 80 }, { subject: '말투', value: 85 }] },
  { id: 3, title: '팀 소개 발표', date: '2025-07-15', thumbnailUrl: 'https://via.placeholder.com/300x169/0000FF/FFFFFF?text=Video3', overallScore: 68, scores: [{ subject: '표정', value: 70 }, { subject: '동작', value: 55 }, { subject: '말투', value: 80 }] },
  { id: 4, title: '최종 발표 리허설', date: '2025-08-04', thumbnailUrl: 'https://via.placeholder.com/300x169/FFFF00/000000?text=Video4', overallScore: 76, scores: [{ subject: '표정', value: 85 }, { subject: '동작', value: 60 }, { subject: '말투', value: 70 }] },
];

interface FeedbackHistoryProps {
  onSelect: (id: number) => void;
  selectedId: number | null;
  onBackToAnalysis: () => void;
  groupColor: string;
}

const FeedbackHistory: React.FC<FeedbackHistoryProps> = ({ onSelect, selectedId, onBackToAnalysis, groupColor }) => {
  return (
    <div className={styles.historyContainer}>
      <div className={styles.header}>
        <button className={styles.backButton} onClick={onBackToAnalysis}>
          <FontAwesomeIcon icon={faArrowLeft} />
          분석으로 돌아가기
        </button>
        <h2 className={styles.title}>피드백 기록</h2>
      </div>
      <div className={styles.grid}>
        {mockHistory.map((item) => (
          <FeedbackPreviewCard
            key={item.id}
            id={item.id}
            title={item.title}
            date={item.date}
            thumbnailUrl={item.thumbnailUrl}
            overallScore={item.overallScore}
            scores={item.scores.map(s => ({ ...s, fullMark: 100 }))}
            isSelected={selectedId === item.id}
            groupColor={groupColor}
            onClick={onSelect}
          />
        ))}
      </div>
    </div>
  );
};

export default FeedbackHistory;
