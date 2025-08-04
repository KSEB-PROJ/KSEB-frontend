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

// 페이지가 가질 수 있는 세 가지 상태 정의
type ViewMode = 'upload' | 'history' | 'analysis';

const FeedbackPage: React.FC = () => {
  // --- 상태 관리 ---
  // 현재 보여줄 뷰를 관리하는 상태. 기본값은 'upload'.
  const [viewMode, setViewMode] = useState<ViewMode>('upload');
  // 사용자가 업로드한 영상 파일을 저장하는 상태.
  const [videoFile, setVideoFile] = useState<File | null>(null);
  // 사용자가 기록 페이지에서 선택한 분석 기록의 ID를 저장하는 상태.
  const [selectedHistoryId, setSelectedHistoryId] = useState<number | null>(null);
  // CSS 변수에서 그룹 색상을 가져와 저장하는 상태.
  const [groupColorRgb, setGroupColorRgb] = useState('132, 0, 255');

  // 컴포넌트 마운트 시, CSS 전역 변수로 선언된 그룹 테마 색상을 읽어와 상태에 적용.
  useEffect(() => {
    const rootStyles = getComputedStyle(document.documentElement);
    const color = rootStyles.getPropertyValue('--group-color').trim();
    if (color) {
      setGroupColorRgb(color);
    }
  }, []);

  // --- 이벤트 핸들러 ---
  // 기록(History) 페이지에서 특정 항목을 선택했을 때 호출됨.
  const handleSelectHistory = (id: number) => {
    setSelectedHistoryId(id);
    setViewMode('analysis'); // 분석 뷰로 전환.
  };

  // 영상 업로드(Upload) 페이지에서 파일이 업로드되고 '분석 시작' 버튼을 눌렀을 때 호출됨.
  const handleVideoUpload = (file: File) => {
    setVideoFile(file);
    setViewMode('analysis'); // 분석 뷰로 전환.
  };

  // 분석 또는 기록 페이지에서 '새 분석 시작' 버튼을 눌렀을 때 호출됨.
  const handleBackToUpload = () => {
    // 모든 상태를 초기화하고 업로드 뷰로 전환.
    setVideoFile(null);
    setSelectedHistoryId(null);
    setViewMode('upload');
  };

  // --- 렌더링 로직 ---
  // 현재 viewMode 상태에 따라 적절한 컴포넌트를 렌더링하는 함수.
  const renderContent = () => {
    switch (viewMode) {
      case 'analysis':
        return (
          <FeedbackAnalysis 
            onOpenHistory={() => setViewMode('history')}
            onBack={handleBackToUpload}
            videoFile={videoFile} // 분석할 파일 전달
            historyId={selectedHistoryId} // 또는 분석할 기록 ID 전달
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
