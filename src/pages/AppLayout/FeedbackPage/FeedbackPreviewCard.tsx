import React from 'react';
import styles from './FeedbackPreviewCard.module.css';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar } from 'recharts';

interface CardProps {
  id: number;
  title: string;
  date: string;
  thumbnailUrl: string;
  overallScore: number;
  scores: { subject: string; value: number; fullMark: number }[];
  isSelected: boolean;
  groupColor: string;
  onClick: (id: number) => void;
}

const FeedbackPreviewCard: React.FC<CardProps> = ({
  id,
  title,
  date,
  thumbnailUrl,
  overallScore,
  scores,
  isSelected,
  groupColor,
  onClick,
}) => {
  const cardStyle = {
    '--card-glow-color': groupColor,
  } as React.CSSProperties;

  return (
    <div
      className={`${styles.card} ${isSelected ? styles.selected : ''}`}
      style={cardStyle}
      onClick={() => onClick(id)}
    >
      <div className={styles.thumbnail}>
        <img src={thumbnailUrl} alt={title} />
        <div className={styles.overlay}>
          <span className={styles.score}>{overallScore}</span>
        </div>
      </div>
      <div className={styles.info}>
        <h3 className={styles.title}>{title}</h3>
        <p className={styles.date}>{date}</p>
      </div>
      <div className={styles.miniChart}>
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={scores} outerRadius="70%">
            <PolarGrid stroke="rgba(255, 255, 255, 0.2)" />
            <PolarAngleAxis dataKey="subject" tick={{ fill: 'transparent', fontSize: 10 }} />
            <Radar
              dataKey="value"
              stroke={isSelected ? groupColor : '#8884d8'}
              fill={isSelected ? groupColor : '#8884d8'}
              fillOpacity={0.6}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default FeedbackPreviewCard;
