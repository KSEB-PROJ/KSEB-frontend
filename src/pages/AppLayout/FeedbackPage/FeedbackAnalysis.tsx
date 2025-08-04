import React, { useState, useEffect } from 'react';
import styles from './FeedbackAnalysis.module.css';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  BarChart, Bar, PieChart, Pie, Cell,
} from 'recharts';
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHistory } from '@fortawesome/free-solid-svg-icons';

// 임시 데이터
const analysisData = {
  videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4', // Placeholder video
  summary: `
### 종합 평가: 76점
발표 내용을 체계적으로 잘 구성하여 청중이 내용을 따라가기 쉬웠습니다.
- **표정:** 대체로 자연스러웠으나, 긴장한 모습이 보여 자신감을 더 표현할 필요가 있습니다.
- **동작:** 손짓이 다소 제한적이어서, 중요한 내용 강조 시 자연스러운 제스처 추가가 필요합니다.
- **말투:** 일부 구간에서 속도가 빨라져, 적절한 속도 조절과 멈춤이 필요합니다.
`,
  overallScore: 76,
  scores: {
    expression: 85,
    gesture: 60,
    speech: 70,
  },
  timelineData: [
    { time: '0s', expression: 40, gesture: 30 },
    { time: '10s', expression: 65, gesture: 50 },
    { time: '20s', expression: 70, gesture: 55 },
    { time: '30s', expression: 50, gesture: 40 },
    { time: '40s', expression: 80, gesture: 70 },
    { time: '50s', expression: 75, gesture: 65 },
    { time: '60s', expression: 85, gesture: 75 },
  ],
  gestureFrequency: [
    { name: '손 모으기', value: 12 },
    { name: '포인팅', value: 8 },
    { name: '제자리 걸음', value: 5 },
    { name: '머리 만지기', value: 3 },
  ],
  fillerWords: [
    { name: '음...', value: 8 },
    { name: '어...', value: 5 },
    { name: '그...', value: 3 },
  ],
};

const PIE_COLORS = ['#00C49F', '#FFBB28', '#FF8042', '#0088FE'];

interface FeedbackAnalysisProps {
  onOpenHistory: () => void;
}

const FeedbackAnalysis: React.FC<FeedbackAnalysisProps> = ({ onOpenHistory }) => {
  const [groupColor, setGroupColor] = useState('rgb(132, 0, 255)');

  useEffect(() => {
    const rootStyles = getComputedStyle(document.documentElement);
    const color = rootStyles.getPropertyValue('--group-color').trim();
    if (color) {
      setGroupColor(`rgb(${color})`);
    }
  }, []);

  const radarData = [
    { subject: '표정', A: analysisData.scores.expression, fullMark: 100 },
    { subject: '동작', A: analysisData.scores.gesture, fullMark: 100 },
    { subject: '말투', A: analysisData.scores.speech, fullMark: 100 },
  ];
  
  const tooltipStyle = {
    backgroundColor: '#2a2a2e',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    color: '#e0e0e0'
  };

  return (
    <div className={styles.analysisContainer}>
      <div className={styles.header}>
        <h2 className={styles.pageTitle}>분석 결과</h2>
        <button className={styles.historyButton} onClick={onOpenHistory}>
          <FontAwesomeIcon icon={faHistory} />
          기록 보기
        </button>
      </div>
      <div className={styles.mainContent}>
        <div className={styles.videoPlayer}>
          <video src={analysisData.videoUrl} controls className={styles.video} />
        </div>
        <div className={styles.summary}>
          <div className={styles.summaryContent}>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{analysisData.summary}</ReactMarkdown>
          </div>
        </div>
      </div>
      <div className={styles.chartsGrid}>
        {/* ... charts ... */}
        <div className={styles.chartCard}>
          <h4 className={styles.chartTitle}>종합 점수</h4>
          <div className={styles.gaugeContainer}>
            <span className={styles.gaugeValue}>{analysisData.overallScore}</span>
            <span className={styles.gaugeUnit}>점</span>
          </div>
        </div>
        <div className={styles.chartCard}>
          <h4 className={styles.chartTitle}>항목별 점수</h4>
          <ResponsiveContainer width="100%" height={200}>
            <RadarChart data={radarData} outerRadius="80%">
              <PolarGrid stroke="rgba(255, 255, 255, 0.2)" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: '#a0a0a0' }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
              <Radar name="Score" dataKey="A" stroke={groupColor} fill={groupColor} fillOpacity={0.6} />
              <Tooltip contentStyle={tooltipStyle} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
        <div className={styles.chartCard}>
          <h4 className={styles.chartTitle}>시간에 따른 표정/동작 변화</h4>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={analysisData.timelineData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
              <XAxis dataKey="time" tick={{ fill: '#a0a0a0' }} />
              <YAxis tick={{ fill: '#a0a0a0' }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ color: '#e0e0e0' }} />
              <Line type="monotone" dataKey="expression" stroke={groupColor} name="표정" dot={false} />
              <Line type="monotone" dataKey="gesture" stroke="#00C49F" name="동작" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className={styles.chartCard}>
          <h4 className={styles.chartTitle}>주요 제스처 빈도</h4>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={analysisData.gestureFrequency} layout="vertical">
              <XAxis type="number" tick={{ fill: '#a0a0a0' }} />
              <YAxis type="category" dataKey="name" width={80} tick={{ fill: '#a0a0a0' }} />
              <Tooltip cursor={{fill: 'rgba(255, 255, 255, 0.1)'}} contentStyle={tooltipStyle} />
              <Bar dataKey="value" fill={groupColor} fillOpacity={0.8} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className={styles.chartCard}>
          <h4 className={styles.chartTitle}>불필요한 단어 사용</h4>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={analysisData.fillerWords} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} fill={groupColor}>
                {analysisData.fillerWords.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} itemStyle={{ color: '#e0e0e0' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className={styles.chartCard}>
            <h4 className={styles.chartTitle}>말하는 속도 (WPM)</h4>
            <div className={styles.wpmContainer}>
                <span className={styles.wpmValue}>142</span>
                <span className={styles.wpmUnit}>WPM</span>
            </div>
            <p className={styles.chartDescription}>적정 속도 범위: 120-150 WPM</p>
        </div>
      </div>
    </div>
  );
};

export default FeedbackAnalysis;