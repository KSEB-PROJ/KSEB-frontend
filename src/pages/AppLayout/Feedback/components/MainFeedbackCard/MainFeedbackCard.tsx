/**
 * @file MainFeedbackCard.tsx
 * @description FeedbackHistory 페이지에서 가장 메인으로 보여지는 큰 피드백 카드 컴포넌트.
 * 선택된 피드백 기록의 상세 정보를 시각적으로 보여줌.
 */
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
  onAnalyze: (id: number) => void; // '상세 분석 보기' 버튼 클릭 시 호출될 콜백
}

const MainFeedbackCard: React.FC<CardProps> = (props) => {
  const { id, title, date, thumbnailUrl, overallScore, summary, onAnalyze } = props;

  return (
    <div className={styles.card}>
      {/* 배경 썸네일 이미지 */}
      <div className={styles.thumbnail}>
        <img src={thumbnailUrl} alt={title} />
      </div>
      {/* 글래스모피즘 효과가 적용된 정보 오버레이 */}
      <div className={styles.glassOverlay}>
        {/* 좌측: 날짜, 제목, 분석 버튼 */}
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
        {/* 우측: 종합 점수 차트와 요약 */}
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
