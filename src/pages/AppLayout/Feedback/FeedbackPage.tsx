/**
 * @file FeedbackPage.tsx
 * @description AI 피드백 기능의 메인 페이지 컨테이너.
 * 사용자의 상호작용에 따라 '업로드', '기록', '분석' 세 가지 뷰(View)를 전환하는 라우터 역할을 함.
 */
import React, { useState, useEffect } from 'react';
import styles from './FeedbackPage.module.css';
import FeedbackHistory from './components/FeedbackHistory/FeedbackHistory';
import FeedbackAnalysis from './components/FeedbackAnalysis/FeedbackAnalysis';
import VideoUpload from './components/VideoUpload/VideoUpload';
import { startVideoAnalysis } from '../../../api/feedbackApi'; // API 호출 함수 임포트

type ViewMode = 'upload' | 'history' | 'analysis';

const FeedbackPage: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('upload');
  const [analysisVideoId, setAnalysisVideoId] = useState<number | null>(null); // 새로 분석할 video_id
  const [selectedHistoryId, setSelectedHistoryId] = useState<number | null>(null);
  const [groupColorRgb, setGroupColorRgb] = useState('132, 0, 255');
  const [isLoading, setIsLoading] = useState(false); // 로딩 상태 추가
  const [error, setError] = useState<string | null>(null); // 에러 상태 추가

  useEffect(() => {
    const rootStyles = getComputedStyle(document.documentElement);
    const color = rootStyles.getPropertyValue('--group-color').trim();
    if (color) {
      setGroupColorRgb(color);
    }
  }, []);

  const handleSelectHistory = (id: number) => {
    setSelectedHistoryId(id);
    setAnalysisVideoId(null); // 새 분석 ID는 초기화
    setViewMode('analysis');
  };

  // VideoUpload에서 받은 파일로 직접 API 호출
  const handleVideoUpload = async (video: File, script: File) => {
    setIsLoading(true);
    setError(null);
    try {
      // '분석 시작' API를 여기서 직접 호출
      const { video_id } = await startVideoAnalysis(video, video.name, script);
      setAnalysisVideoId(video_id);
      setSelectedHistoryId(null); // 이전 기록 ID는 초기화
      setViewMode('analysis');
    } catch (err) {
      console.error("분석 시작 요청 실패:", err);
      setError("분석 시작 요청에 실패했습니다. 잠시 후 다시 시도해주세요.");
      // 실패 시 업로드 화면에 머무르도록 viewMode를 변경하지 않거나, 'upload'로 명시적 설정
      setViewMode('upload'); 
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToUpload = () => {
    setAnalysisVideoId(null);
    setSelectedHistoryId(null);
    setViewMode('upload');
  };

  const renderContent = () => {
    switch (viewMode) {
      case 'analysis':
        return (
          <FeedbackAnalysis 
            onOpenHistory={() => setViewMode('history')}
            onBack={handleBackToUpload}
            videoId={analysisVideoId} // 새로 분석할 ID
            historyId={selectedHistoryId} // 이전 기록 ID
          />
        );
      case 'history':
        return (
          <FeedbackHistory
            onSelect={handleSelectHistory}
            onBack={handleBackToUpload}
          />
        );
      case 'upload':
      default:
        return (
          <VideoUpload 
            onVideoUpload={handleVideoUpload}
            onShowHistory={() => setViewMode('history')}
            isLoading={isLoading} // 로딩 상태 전달
            error={error} // 에러 상태 전달
          />
        );
    }
  };

  return (
    <div className={styles.pageContainer} style={{'--group-color-rgb': groupColorRgb} as React.CSSProperties}>
      {renderContent()}
    </div>
  );
};

export default FeedbackPage;
