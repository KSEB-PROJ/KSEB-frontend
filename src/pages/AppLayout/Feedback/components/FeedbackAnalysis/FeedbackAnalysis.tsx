import React, { useState, useRef, useCallback, useEffect } from 'react';
import styles from './FeedbackAnalysis.module.css';
import {
  ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
} from 'recharts';
import type { TooltipProps } from 'recharts';
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHistory, faPlus, faSpinner, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import ScoreCircularChart from '../ScoreCircularChart/ScoreCircularChart';
import { getAnalysisResultById } from '../../../../../api/feedbackApi';
import { transformAnalysisData } from '../../../../../utils/feedbackDataTransformer';
import type { FrontendData } from '../../../../../utils/feedbackDataTransformer';

// --- Custom Tooltip Component ---
interface CustomTooltipPayload {
  name: string;
  value: number | string;
  color?: string;
}

interface CustomTooltipProps extends TooltipProps<number, string> {
  payload?: CustomTooltipPayload[];
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className={styles.customTooltip}>
        <p className={styles.tooltipLabel}>{label || payload[0].name}</p>
        {payload.map((pld, index) => (
          <p key={index} className={styles.tooltipDesc} style={{ color: pld.color || '#fff' }}>
            {`${pld.name}: ${pld.value}`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

interface FeedbackAnalysisProps {
  onOpenHistory: () => void;
  onBack: () => void;
  videoId?: number | null;      // 새로 분석할 ID
  historyId?: number | null;  // 조회할 이전 기록 ID
}

const POLLING_INTERVAL = 5000;
const MAX_POLLING_ATTEMPTS = 60;

const FeedbackAnalysis: React.FC<FeedbackAnalysisProps> = ({ onOpenHistory, onBack, videoId, historyId }) => {
  const [analysisData, setAnalysisData] = useState<FrontendData | null>(null);
  const [loadingStatus, setLoadingStatus] = useState('분석 준비 중...');
  const [error, setError] = useState<string | null>(null);
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  
  const [groupColor, setGroupColor] = useState('rgb(132, 0, 255)');
  const [groupColorRgb, setGroupColorRgb] = useState('132, 0, 255');

  const pollingCount = useRef(0);
  const pollingIntervalId = useRef<number | null>(null);

  const startPolling = useCallback((id: number) => {
    pollingCount.current = 0;
    setLoadingStatus(`분석 시작됨 (ID: ${id}). 결과 확인 중...`);

    pollingIntervalId.current = window.setInterval(async () => {
      if (pollingCount.current >= MAX_POLLING_ATTEMPTS) {
        if (pollingIntervalId.current) clearInterval(pollingIntervalId.current);
        setError("분석 시간이 너무 오래 걸립니다. 잠시 후 기록 페이지에서 다시 확인해주세요.");
        return;
      }
      try {
        const serverData = await getAnalysisResultById(id);
        if (pollingIntervalId.current) clearInterval(pollingIntervalId.current);
        const transformedData = transformAnalysisData(serverData);
        setAnalysisData(transformedData);
        setVideoSrc(transformedData.videoUrl);
        setLoadingStatus("");
      } catch (err: unknown) {
        const error = err as { response?: { status: number } };
        if (error.response && error.response.status === 404) {
          pollingCount.current++;
          setLoadingStatus(`결과 확인 중... (${pollingCount.current * 5}초)`);
        } else {
          if (pollingIntervalId.current) clearInterval(pollingIntervalId.current);
          setError("결과를 가져오는 중 오류가 발생했습니다.");
          console.error(err);
        }
      }
    }, POLLING_INTERVAL);
  }, []);

  const handleHistoryAnalysis = useCallback(async (id: number) => {
    setLoadingStatus("이전 분석 기록을 불러오는 중...");
    try {
      const serverData = await getAnalysisResultById(id);
      const transformedData = transformAnalysisData(serverData);
      setAnalysisData(transformedData);
      setVideoSrc(transformedData.videoUrl);
      setLoadingStatus("");
    } catch (err) {
      setError("이전 기록을 불러오는 데 실패했습니다.");
      console.error(err);
    }
  }, []);

  useEffect(() => {
    const rootStyles = getComputedStyle(document.documentElement);
    const color = rootStyles.getPropertyValue('--group-color').trim();
    if (color) {
      setGroupColor(`rgb(${color})`);
      setGroupColorRgb(color);
    }

    const analysisId = videoId || historyId;

    if (analysisId) {
      if (videoId) {
        startPolling(analysisId);
      } else {
        handleHistoryAnalysis(analysisId);
      }
    } else {
      setError("분석할 ID가 없습니다.");
    }

    return () => {
      if (pollingIntervalId.current) {
        clearInterval(pollingIntervalId.current);
      }
    };
  }, [videoId, historyId, startPolling, handleHistoryAnalysis]);

  const renderContent = () => {
    if (loadingStatus && !analysisData) {
      return <div className={styles.statusContainer}><FontAwesomeIcon icon={faSpinner} spin size="3x" /><p>{loadingStatus}</p></div>;
    }
    if (error) {
      return <div className={styles.statusContainer}><FontAwesomeIcon icon={faExclamationTriangle} size="3x" color="#ff4d4d" /><p>{error}</p><button className={styles.historyButton} onClick={onBack}>돌아가기</button></div>;
    }
    if (!analysisData) {
      return <div className={styles.statusContainer}><p>분석 데이터가 없습니다.</p><button className={styles.historyButton} onClick={onBack}>돌아가기</button></div>;
    }
    
    const EMOTION_COLORS: { [key: string]: string } = {
      Angry: '#FF6B6B', Fear: '#8D6E63', Surprise: '#FFD54F',
      Happy: '#4CAF50', Sad: '#7986CB', Neutral: groupColor,
    };

    return (
      <div className={styles.dashboardGrid}>
        <div className={`${styles.card} ${styles.videoPlayer}`}>
          <video src={videoSrc || ''} controls className={styles.video} />
        </div>
        <div className={`${styles.card} ${styles.summary}`}>
          <h4 className={styles.cardTitle}>AI 종합 피드백</h4>
          <div className={styles.summaryContent}>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{analysisData.detailFeedback}</ReactMarkdown>
            <div className={styles.finalReport}>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{analysisData.finalReport}</ReactMarkdown>
            </div>
          </div>
        </div>
        <div className={`${styles.card} ${styles.confidenceRadar}`}>
          <h4 className={styles.cardTitle}>자신감 분석</h4>
          <div className={styles.chartContainer}>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={analysisData.confidenceRadarData}>
                <PolarGrid stroke="rgba(255, 255, 255, 0.2)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#e0e0e0', fontSize: 14 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar name="Confidence" dataKey="score" stroke={groupColor} fill={groupColor} fillOpacity={0.6} />
                <Tooltip content={<CustomTooltip />} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className={`${styles.card} ${styles.emotionChart}`}>
          <h4 className={styles.cardTitle}>감정 분포</h4>
          <div className={styles.chartContainer}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={analysisData.emotionChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius="80%" label>
                  {analysisData.emotionChartData.map((entry: { name: string }, index: number) => (
                    <Cell key={`cell-${index}`} fill={EMOTION_COLORS[entry.name]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className={`${styles.card} ${styles.overallScore}`}>
          <h4 className={styles.cardTitle}>종합 점수</h4>
          <div className={styles.chartContainer}>
            <ScoreCircularChart score={analysisData.overallScore} />
          </div>
        </div>
        <div className={`${styles.card} ${styles.poseChart}`}>
          <h4 className={styles.cardTitle}>자세 안정도</h4>
           <div className={styles.chartContainer}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analysisData.poseFrequencyData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                <XAxis type="number" tick={{ fill: '#a0a0a0' }} />
                <YAxis type="category" dataKey="name" tick={{ fill: '#e0e0e0' }} width={80} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255, 255, 255, 0.1)' }}/>
                <Bar dataKey="count" name="프레임 수" barSize={30}>
                   {analysisData.poseFrequencyData.map((entry: { name: string }) => (
                    <Cell key={`cell-${entry.name}`} fill={entry.name === 'GOOD' ? '#4CAF50' : '#FF6B6B'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className={`${styles.card} ${styles.speedTimeline}`}>
          <h4 className={styles.cardTitle}>시간에 따른 말 빠르기 (WPM)</h4>
          <div className={styles.chartContainer}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analysisData.speedTimelineData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                <XAxis dataKey="time" tick={{ fill: '#a0a0a0' }} />
                <YAxis domain={[0, 200]} tick={{ fill: '#a0a0a0' }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line type="monotone" dataKey="wpm" name="WPM" stroke={groupColor} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className={`${styles.card} ${styles.pitchTimeline}`}>
          <h4 className={styles.cardTitle}>시간에 따른 음높이 (Hz)</h4>
          <div className={styles.chartContainer}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analysisData.pitchTimelineData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                <XAxis dataKey="time" tick={{ fill: '#a0a0a0' }} />
                <YAxis domain={[0, 300]} tick={{ fill: '#a0a0a0' }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line type="monotone" dataKey="hz" name="Hz" stroke="#00C49F" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={styles.analysisContainer} style={{ '--group-color-rgb': groupColorRgb } as React.CSSProperties}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.pageTitle}>분석 결과</h2>
          {analysisData && <p className={styles.pageSubtitle}>분석 파일: {analysisData.title}</p>}
        </div>
        <div className={styles.buttonGroup}>
          <button className={styles.historyButton} onClick={onBack}><FontAwesomeIcon icon={faPlus} /> 새 분석 시작</button>
          <button className={styles.historyButton} onClick={onOpenHistory}><FontAwesomeIcon icon={faHistory} /> 기록 보기</button>
        </div>
      </div>
      {renderContent()}
    </div>
  );
};

export default FeedbackAnalysis;
