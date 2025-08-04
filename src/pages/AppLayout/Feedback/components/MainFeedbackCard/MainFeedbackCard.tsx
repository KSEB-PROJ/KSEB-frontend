import React from 'react';
import styles from './MainFeedbackCard.module.css';
import ScoreCircularChart from '../ScoreCircularChart/ScoreCircularChart';

interface CardProps {
  id: number;
  title: string;
  date: string;
  thumbnailUrl: string;
  overallScore: number;
  summary: string;
  onAnalyze: (id: number) => void;
}

const MainFeedbackCard: React.FC<CardProps> = (props) => {
  const { id, title, date, thumbnailUrl, overallScore, summary, onAnalyze } = props;

  return (
    <div className={styles.card}>
      <div className={styles.thumbnail}>
        <img src={thumbnailUrl} alt={title} />
      </div>
      <div className={styles.glassOverlay}>
        <div className={styles.info}>
          <p className={styles.date}>{date}</p>
          <h3 className={styles.title}>{title}</h3>
          <button
            className={styles.analyzeButton}
            onClick={() => onAnalyze(id)}
          >
            상세 분석 보기
          </button>
        </div>
        <div className={styles.dataPanel}>
          <div className={styles.chartArea}>
            <ScoreCircularChart score={overallScore} />
          </div>
          <div className={styles.summaryArea}>
            <h4 className={styles.summaryTitle}>Key Feedback</h4>
            <p className={styles.summaryText}>{summary}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainFeedbackCard;