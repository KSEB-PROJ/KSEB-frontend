import React, { useState, useEffect } from 'react';
import styles from './FeedbackPage.module.css';
import FeedbackHistory from './FeedbackHistory';
import FeedbackAnalysis from './FeedbackAnalysis';
import VideoUpload from './VideoUpload';

const FeedbackPage: React.FC = () => {
  const [viewMode, setViewMode] = useState<'analysis' | 'history'>('analysis');
  const [selectedFeedbackId, setSelectedFeedbackId] = useState<number | null>(4);
  const [videoFile, setVideoFile] = useState<File | null>(new File([], "mock.mp4"));
  const [groupColor, setGroupColor] = useState('rgb(132, 0, 255)');

  useEffect(() => {
    const rootStyles = getComputedStyle(document.documentElement);
    const color = rootStyles.getPropertyValue('--group-color').trim();
    if (color) {
      setGroupColor(`rgb(${color})`);
    }
  }, []);

  const handleSelectHistory = (id: number) => {
    setSelectedFeedbackId(id);
    // 실제 앱에서는 ID에 맞는 데이터를 불러온 후 분석 화면으로 전환
    setViewMode('analysis');
  };

  const handleVideoUpload = (file: File) => {
    setVideoFile(file);
    const newId = 5; // 임시 ID
    setSelectedFeedbackId(newId);
    setViewMode('analysis');
  };

  // videoFile이 없으면 업로드 화면을 먼저 보여줌
  if (!videoFile) {
    return (
      <div className={styles.pageContainer}>
        <div className={styles.uploadWrapper}>
          <h1 className={styles.pageTitle}>AI 발표 피드백</h1>
          <p className={styles.pageDescription}>
            당신의 발표 영상을 업로드하고, AI의 체계적인 분석과 피드백을 받아보세요. <br />
            표정, 제스처, 말투를 정밀하게 분석하여 발표 능력을 향상시킬 수 있도록 돕습니다.
          </p>
          <VideoUpload onVideoUpload={handleVideoUpload} />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      <div className={`${styles.viewContainer} ${viewMode === 'history' ? styles.showHistory : ''}`}>
        <div className={styles.analysisView}>
          <FeedbackAnalysis onOpenHistory={() => setViewMode('history')} />
        </div>
        <div className={styles.historyView}>
          <FeedbackHistory
            onSelect={handleSelectHistory}
            selectedId={selectedFeedbackId}
            onBackToAnalysis={() => setViewMode('analysis')}
            groupColor={groupColor}
          />
        </div>
      </div>
    </div>
  );
};

export default FeedbackPage;
