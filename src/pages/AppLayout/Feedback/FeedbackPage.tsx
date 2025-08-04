import React, { useState, useEffect } from 'react';
import styles from './FeedbackPage.module.css';
import FeedbackHistory from './components/FeedbackHistory/FeedbackHistory';
import FeedbackAnalysis from './components/FeedbackAnalysis/FeedbackAnalysis';
import VideoUpload from './components/VideoUpload/VideoUpload';

type ViewMode = 'upload' | 'history' | 'analysis';

const FeedbackPage: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('upload');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [selectedHistoryId, setSelectedHistoryId] = useState<number | null>(null);
  const [groupColorRgb, setGroupColorRgb] = useState('132, 0, 255'); // Default color

  useEffect(() => {
    const rootStyles = getComputedStyle(document.documentElement);
    const color = rootStyles.getPropertyValue('--group-color').trim();
    if (color) {
      setGroupColorRgb(color);
    }
  }, []);

  const handleSelectHistory = (id: number) => {
    setSelectedHistoryId(id);
    setViewMode('analysis');
  };

  const handleVideoUpload = (file: File) => {
    setVideoFile(file);
    setViewMode('analysis');
  };

  const handleBackToUpload = () => {
    setVideoFile(null);
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
            videoFile={videoFile}
            historyId={selectedHistoryId}
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
