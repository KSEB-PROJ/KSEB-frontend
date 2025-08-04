/**
 * @file SubFeedbackCard.tsx
 * @description FeedbackHistory 페이지 하단의 스크롤 영역에 표시되는 작은 피드백 카드.
 * 클릭 시 해당 카드의 내용을 메인 카드로 보여주는 역할을 함.
 */
import React from 'react';
import styles from './SubFeedbackCard.module.css';

interface CardProps {
  id: number;
  title: string;
  date: string;
  thumbnailUrl: string;
  overallScore: number;
  onClick: (id: number) => void; // 카드 클릭 시 호출될 콜백
}

const SubFeedbackCard: React.FC<CardProps> = (props) => {
  const { id, title, date, thumbnailUrl, overallScore, onClick } = props;

  return (
    <div 
      className={styles.card} 
      onClick={() => onClick(id)}
    >
      <img src={thumbnailUrl} alt={title} className={styles.thumbnail} />
      <div className={styles.info}>
        <p className={styles.title}>{title}</p>
        <p className={styles.date}>{date}</p>
      </div>
      <div className={styles.score}>{overallScore}</div>
      {/* 호버 시 나타나는 장식용 라인 */}
      <div className={styles.glowLine}></div>
    </div>
  );
};

export default SubFeedbackCard;
