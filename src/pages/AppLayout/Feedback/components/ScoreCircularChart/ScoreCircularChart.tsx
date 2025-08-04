import React from 'react';
import styles from './ScoreCircularChart.module.css';

interface ScoreCircularChartProps {
  score: number;
}

const ScoreCircularChart: React.FC<ScoreCircularChartProps> = ({ score }) => {
  const radius = 85;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className={styles.chartContainer}>
      <svg className={styles.chartSvg} viewBox="0 0 200 200">
        <circle className={styles.backgroundCircle} cx="100" cy="100" r={radius} />
        <circle
          className={styles.progressCircle}
          cx="100"
          cy="100"
          r={radius}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
        <text x="50%" y="50%" textAnchor="middle" dy=".3em" className={styles.scoreText}>
          {score}
          <tspan className={styles.unit}>점</tspan>
        </text>
      </svg>
    </div>
  );
};

export default ScoreCircularChart;