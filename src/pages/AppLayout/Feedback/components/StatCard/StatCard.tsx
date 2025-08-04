/**
 * @file StatCard.tsx
 * @description 표정, 동작, 말투 등 개별 분석 항목의 점수를 보여주는 작은 카드 컴포넌트.
 * 점수에 비례하여 배경이 채워지는 시각적 효과를 가짐.
 */
import React from 'react';
import styles from './StatCard.module.css';

interface StatCardProps {
  title: string;       // 카드 제목 (예: "표정")
  score: number;       // 0-100 사이의 점수
  description: string; // 부가 설명 (예: "얼굴 감정 표현")
}

const StatCard: React.FC<StatCardProps> = ({ title, score, description }) => {
  // 점수에 따라 배경의 높이가 달라지도록 인라인 스타일을 계산.
  const fillStyle: React.CSSProperties = {
    height: `${score}%`,
    // 그룹 테마 색상을 이용한 그라데이션 배경.
    background: `linear-gradient(to top, rgba(var(--group-color-rgb), 0.4), rgba(var(--group-color-rgb), 0.1))`,
  };

  return (
    <div className={styles.card}>
      {/* 점수에 따라 높이가 변하는 배경 요소 */}
      <div className={styles.backgroundFill} style={fillStyle}></div>
      {/* 실제 콘텐츠 (제목, 점수, 설명) */}
      <div className={styles.content}>
        <div className={styles.header}>
          <h5 className={styles.title}>{title}</h5>
          <div className={styles.score}>{score}</div>
        </div>
        <p className={styles.description}>{description}</p>
      </div>
    </div>
  );
};

export default StatCard;
