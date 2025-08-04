import React, { useState, useEffect } from 'react';
import styles from './FeedbackAnalysis.module.css';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  BarChart, Bar, Cell, RadarChart, PolarGrid, PolarAngleAxis, Radar,
} from 'recharts';
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHistory, faPlus } from '@fortawesome/free-solid-svg-icons';
import ScoreCircularChart from '../ScoreCircularChart/ScoreCircularChart';
import StatCard from '../StatCard/StatCard';

const analysisData = {
  videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
  summary: `### AI 종합 평가 보고서

**발표 개요:** "분기별 실적 보고 및 향후 전략"을 주제로 한 발표입니다. 전반적으로 논리적인 흐름과 명확한 데이터 제시가 돋보였습니다.

---

### 긍정적인 부분 (Strengths)

*   **전달력:** 핵심 메시지를 명확하고 간결하게 전달하는 능력이 뛰어납니다. 복잡한 데이터를 시각적으로 잘 구성하여 청중의 이해를 도왔습니다.
*   **자신감:** 발표 초반과 중반에 걸쳐 안정적인 목소리 톤과 자세를 유지하여 높은 자신감을 보여주었습니다.
*   **콘텐츠 구성:** 서론, 본론, 결론의 구조가 명확하여 발표의 전체적인 흐름을 따라가기 용이했습니다.

### 개선 제안 (Areas for Improvement)

*   **시선 처리:** 발표 후반부(3분 10초 이후)부터 스크립트에 의존하는 경향이 나타나며 시선이 아래로 향하는 빈도가 잦아졌습니다. 이는 청중과의 교감을 저해할 수 있습니다.
*   **제스처 다양성:** 특정 제스처(손 모으기, 포인팅)가 반복적으로 사용되었습니다. 내용을 강조하거나 전환할 때 더 다양한 제스처를 활용하면 발표가 더욱 생동감 있게 전달될 것입니다.
*   **속도 조절:** 질의응답 세션에서 답변 속도가 다소 빨라지는 경향이 있었습니다. 질문의 요지를 다시 한번 확인하고, 답변을 구조화하여 전달하는 연습이 필요합니다.

---

### 구간별 상세 분석

| 시간 구간 | 표정 (점수) | 제스처 (점수) | 말투 (점수) | 주요 이벤트 |
| :--- | :---: | :---: | :---: | :--- |
| 0:00-1:30 | 85 | 75 | 80 | 안정적인 발표 시작, 자신감 있는 시선 처리 |
| 1:31-3:00 | 80 | 65 | 75 | 데이터 설명 시 약간의 시선 불안정 |
| 3:01-5:00 | 70 | 60 | 70 | 스크립트 의존도 증가, 반복적인 제스처 |
| 5:01-끝 | 75 | 68 | 65 | Q&A 세션, 답변 속도 빠름 |

### 최종 권장사항

1.  **시선 분산 연습:** 스크립트를 핵심 키워드 중심으로 재구성하고, 카메라 렌즈(청중)를 여러 구역으로 나누어 시선을 분산시키는 연습을 해보세요.
2.  **제스처 녹화 및 분석:** 본인의 발표를 직접 녹화하여 제스처 패턴을 분석하고, 강조하고 싶은 부분에서 어떤 제스처를 사용할지 미리 계획해보는 것이 좋습니다.
3.  **모의 Q&A 진행:** 예상 질문 리스트를 만들고, 동료들과 함께 모의 질의응답 세션을 진행하며 답변 속도를 조절하고 논리적으로 말하는 연습을 하는 것을 추천합니다.

이 피드백이 발표 능력 향상에 도움이 되기를 바랍니다.
`,
  overallScore: 76,
  scores: {
    expression: 85,
    gesture: 60,
    speech: 70,
  },
  confidence: [
      { subject: '음성', value: 75, fullMark: 100 },
      { subject: '시선', value: 60, fullMark: 100 },
      { subject: '자세', value: 80, fullMark: 100 },
  ],
  timelineData: [
    { time: '0s', expression: 40, gesture: 30 }, { time: '10s', expression: 65, gesture: 50 },
    { time: '20s', expression: 70, gesture: 55 }, { time: '30s', expression: 50, gesture: 40 },
    { time: '40s', expression: 80, gesture: 70 }, { time: '50s', expression: 75, gesture: 65 },
    { time: '60s', expression: 85, gesture: 75 },
  ],
  gestureFrequency: [
    { name: '손 모으기', value: 12, fill: '#8884d8' }, { name: '포인팅', value: 8, fill: '#83a6ed' },
    { name: '제자리 걸음', value: 5, fill: '#8dd1e1' }, { name: '머리 만지기', value: 3, fill: '#82ca9d' },
  ],
  fillerWords: [
    { name: '음...', value: 8 }, { name: '어...', value: 5 }, { name: '그...', value: 3 },
  ],
};

interface FeedbackAnalysisProps {
  onOpenHistory: () => void;
  onBack: () => void;
  videoFile?: File | null;
  historyId?: number | null;
}

const FeedbackAnalysis: React.FC<FeedbackAnalysisProps> = ({ onOpenHistory, onBack, videoFile, historyId }) => {
  const [groupColor, setGroupColor] = useState('rgb(132, 0, 255)');
  const [groupColorRgb, setGroupColorRgb] = useState('132, 0, 255');

  useEffect(() => {
    const rootStyles = getComputedStyle(document.documentElement);
    const color = rootStyles.getPropertyValue('--group-color').trim();
    if (color) {
      setGroupColor(`rgb(${color})`);
      setGroupColorRgb(color);
    }
  }, []);
  
  const tooltipStyle = {
    backgroundColor: '#2a2a2e',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    color: '#e0e0e0'
  };

  const tooltipItemStyle = {
    color: '#e0e0e0'
  };
  
  const tooltipLabelStyle = {
    color: '#ffffff',
    fontWeight: 'bold'
  }

  return (
    <div className={styles.analysisContainer} style={{'--group-color-rgb': groupColorRgb} as React.CSSProperties}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.pageTitle}>분석 결과</h2>
          {videoFile && <p className={styles.pageSubtitle}>분석 파일: {videoFile.name}</p>}
        </div>
        <div className={styles.buttonGroup}>
          <button className={styles.historyButton} onClick={onBack}>
            <FontAwesomeIcon icon={faPlus} />
            새 분석 시작
          </button>
          <button className={styles.historyButton} onClick={onOpenHistory}>
            <FontAwesomeIcon icon={faHistory} />
            기록 보기
          </button>
        </div>
      </div>
      
      <div className={styles.dashboardGrid}>
        <div className={`${styles.card} ${styles.videoPlayer}`}>
          <video src={analysisData.videoUrl} controls className={styles.video} />
        </div>

        <div className={`${styles.card} ${styles.summary}`}>
          <div className={styles.summaryContent}>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{analysisData.summary}</ReactMarkdown>
          </div>
        </div>

        <div className={`${styles.card} ${styles.overallScore}`}>
          <h4 className={styles.cardTitle}>종합 점수</h4>
          <div className={styles.chartContainer}>
            <ScoreCircularChart score={analysisData.overallScore} />
          </div>
        </div>

        <div className={`${styles.card} ${styles.timeline}`}>
          <h4 className={styles.cardTitle}>시간에 따른 변화</h4>
          <div className={styles.chartContainer}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analysisData.timelineData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorExpression" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={groupColor} stopOpacity={0.8}/>
                    <stop offset="95%" stopColor={groupColor} stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorGesture" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00C49F" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#00C49F" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                <XAxis dataKey="time" tick={{ fill: '#a0a0a0' }} />
                <YAxis tick={{ fill: '#a0a0a0' }} />
                <Tooltip 
                  contentStyle={tooltipStyle} 
                  itemStyle={tooltipItemStyle}
                  labelStyle={tooltipLabelStyle}
                />
                <Legend wrapperStyle={{ color: '#e0e0e0' }} />
                <Area type="monotone" dataKey="expression" name="표정" stroke={groupColor} fill="url(#colorExpression)" />
                <Area type="monotone" dataKey="gesture" name="동작" stroke="#00C49F" fill="url(#colorGesture)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={`${styles.card} ${styles.expression}`}>
          <StatCard title="표정" score={analysisData.scores.expression} description="얼굴 감정 표현" />
        </div>

        <div className={`${styles.card} ${styles.gesture}`}>
          <StatCard title="동작" score={analysisData.scores.gesture} description="손과 몸의 움직임" />
        </div>

        <div className={`${styles.card} ${styles.speech}`}>
          <StatCard title="말투" score={analysisData.scores.speech} description="목소리 톤과 속도" />
        </div>
        
        <div className={`${styles.card} ${styles.fillerWords}`}>
           <h4 className={styles.cardTitle}>불필요한 단어</h4>
           <div className={styles.chartContainer}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analysisData.fillerWords} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" tick={{ fill: '#e0e0e0' }} tickLine={false} axisLine={false} width={60} />
                <Tooltip 
                  contentStyle={tooltipStyle}
                  itemStyle={tooltipItemStyle}
                  labelStyle={tooltipLabelStyle}
                  cursor={{ fill: 'rgba(255, 255, 255, 0.1)' }}
                />
                <Bar dataKey="value" name="빈도" fill={groupColor} barSize={15} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={`${styles.card} ${styles.gestureFrequency}`}>
          <h4 className={styles.cardTitle}>주요 제스처 빈도</h4>
          <div className={styles.chartContainer}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analysisData.gestureFrequency} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                <XAxis type="number" hide tick={{ fill: '#a0a0a0' }} />
                <YAxis type="category" dataKey="name" tick={{ fill: '#e0e0e0' }} tickLine={false} axisLine={false} width={80} />
                <Tooltip 
                  contentStyle={tooltipStyle}
                  itemStyle={tooltipItemStyle}
                  labelStyle={tooltipLabelStyle}
                  cursor={{ fill: 'rgba(255, 255, 255, 0.1)' }}
                />
                <Bar dataKey="value" name="빈도" barSize={20}>
                  {analysisData.gestureFrequency.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={`${styles.card} ${styles.confidence}`}>
          <h4 className={styles.cardTitle}>자신감 분석</h4>
          <div className={styles.chartContainer}>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={analysisData.confidence}>
                <PolarGrid stroke="rgba(255, 255, 255, 0.2)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#e0e0e0', fontSize: 14 }} />
                <Radar name="Confidence" dataKey="value" stroke={groupColor} fill={groupColor} fillOpacity={0.6} />
                <Tooltip contentStyle={tooltipStyle} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeedbackAnalysis;
