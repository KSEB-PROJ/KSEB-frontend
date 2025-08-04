import React from 'react';
import styles from './StatCard.module.css';

interface StatCardProps {
  title: string;
  score: number;
  description: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, score, description }) => {
  const fillStyle: React.CSSProperties = {
    height: `${score}%`,
    background: `linear-gradient(to top, rgba(var(--group-color-rgb), 0.4), rgba(var(--group-color-rgb), 0.1))`,
  };

  return (
    <div className={styles.card}>
      <div className={styles.backgroundFill} style={fillStyle}></div>
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