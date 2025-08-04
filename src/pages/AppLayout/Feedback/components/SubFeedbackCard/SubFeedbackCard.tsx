import React from 'react';
import styles from './SubFeedbackCard.module.css';

interface CardProps {
  id: number;
  title: string;
  date: string;
  thumbnailUrl: string;
  overallScore: number;
  onClick: (id: number) => void;
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
      <div className={styles.glowLine}></div>
    </div>
  );
};

export default SubFeedbackCard;