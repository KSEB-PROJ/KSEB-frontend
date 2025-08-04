import React from 'react';
import styles from './ConfidenceGauge.module.css';

interface ConfidenceGaugeProps {
  label: string;
  score: number;
  color: string;
}

const ConfidenceGauge: React.FC<ConfidenceGaugeProps> = ({ label, score, color }) => {
  const circumference = 2 * Math.PI * 45; // radius = 45
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className={styles.gaugeContainer}>
      <svg className={styles.gauge} viewBox="0 0 100 55">
        <path
          className={styles.gaugeBackground}
          d="M 5 50 A 45 45 0 0 1 95 50"
          fill="none"
        />
        <path
          className={styles.gaugeValue}
          d="M 5 50 A 45 45 0 0 1 95 50"
          fill="none"
          stroke={color}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className={styles.label}>{label}</div>
      <div className={styles.score} style={{ color }}>{score}%</div>
    </div>
  );
};

export default ConfidenceGauge;
