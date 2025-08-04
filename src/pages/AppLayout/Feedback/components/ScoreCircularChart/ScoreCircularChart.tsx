/**
 * @file ScoreCircularChart.tsx
 * @description 종합 점수를 원형 차트 형태로 시각화하는 재사용 가능한 컴포넌트.
 * SVG와 CSS stroke 속성을 이용해 동적인 원형 프로그레스 바를 구현.
 */
import React from 'react';
import styles from './ScoreCircularChart.module.css';

interface ScoreCircularChartProps {
  score: number; // 0-100 사이의 점수
}

const ScoreCircularChart: React.FC<ScoreCircularChartProps> = ({ score }) => {
  const radius = 85; // 원의 반지름
  const circumference = 2 * Math.PI * radius; // 원의 둘레
  // 점수에 비례하여 채워지지 않을 부분(offset)을 계산.
  // stroke-dashoffset을 이용해 프로그레스 효과를 줌.
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className={styles.chartContainer}>
      <svg className={styles.chartSvg} viewBox="0 0 200 200">
        {/* 배경이 되는 회색 원 */}
        <circle className={styles.backgroundCircle} cx="100" cy="100" r={radius} />
        {/* 점수에 따라 채워지는 진행 상태 원 */}
        <circle
          className={styles.progressCircle}
          cx="100"
          cy="100"
          r={radius}
          strokeDasharray={circumference} // dash의 길이를 원의 둘레와 같게 설정
          strokeDashoffset={offset}      // dash의 시작점을 offset만큼 이동시켜 채워지는 효과 생성
        />
        {/* 중앙에 표시될 점수 텍스트 */}
        <text x="50%" y="50%" textAnchor="middle" dy=".3em" className={styles.scoreText}>
          {score}
          <tspan className={styles.unit}>점</tspan>
        </text>
      </svg>
    </div>
  );
};

export default ScoreCircularChart;
