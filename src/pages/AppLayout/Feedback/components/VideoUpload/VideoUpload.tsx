/**
 * @file VideoUpload.tsx
 * @description 피드백 기능의 시작 화면.
 * 사용자가 영상과 대본 파일을 업로드하고, 서비스의 핵심 기능을 인지하는 역할을 함.
 */
import React, { useCallback, useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import styles from './VideoUpload.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUpload, faHistory, faSmile, faHandSparkles, faVolumeUp, faFileVideo, faFileLines, faSpinner, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';

interface VideoUploadProps {
  onVideoUpload: (videoFile: File, scriptFile: File) => void;
  onShowHistory: () => void;
  isLoading: boolean;
  error: string | null;
}

const VideoUpload: React.FC<VideoUploadProps> = ({ onVideoUpload, onShowHistory, isLoading, error }) => {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [scriptFile, setScriptFile] = useState<File | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsMounted(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const onVideoDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) setVideoFile(acceptedFiles[0]);
  }, []);

  const onScriptDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) setScriptFile(acceptedFiles[0]);
  }, []);

  const { getRootProps: getVideoRootProps, getInputProps: getVideoInputProps, isDragActive: isVideoDragActive } = useDropzone({
    onDrop: onVideoDrop,
    accept: { 'video/mp4': ['.mp4'], 'video/webm': ['.webm'], 'video/quicktime': ['.mov'] },
    multiple: false,
    disabled: !!videoFile || isLoading,
  });

  const { getRootProps: getScriptRootProps, getInputProps: getScriptInputProps, isDragActive: isScriptDragActive } = useDropzone({
    onDrop: onScriptDrop,
    accept: { 'text/plain': ['.txt'] },
    multiple: false,
    disabled: !videoFile || isLoading,
  });

  const handleAnalyzeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoFile && scriptFile) {
      onVideoUpload(videoFile, scriptFile);
    }
  };

  const handleRemoveVideo = (e: React.MouseEvent) => {
    e.stopPropagation();
    setVideoFile(null);
    setScriptFile(null);
  };

  const handleRemoveScript = (e: React.MouseEvent) => {
    e.stopPropagation();
    setScriptFile(null);
  };

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.gridBg}></div>
      <div className={styles.contentContainer}>
        <div className={`${styles.leftColumn} ${isMounted ? styles.enter : ''}`}>
          <div className={styles.uploadArea}>
            {/* --- Video Dropzone --- */}
            <div {...getVideoRootProps()} className={`${styles.dropzone} ${styles.videoDropzone} ${isVideoDragActive ? styles.active : ''} ${videoFile ? styles.hasFile : ''}`}>
              <input {...getVideoInputProps()} />
              <div className={styles.dropzoneContentWrapper}>
                {videoFile ? (
                  <div className={styles.fileSelectedContent}>
                    <FontAwesomeIcon icon={faFileVideo} className={styles.fileIcon} />
                    <p className={styles.fileName}>{videoFile.name}</p>
                    <p className={styles.fileSize}>{(videoFile.size / 1024 / 1024).toFixed(2)} MB</p>
                    <button className={styles.cancelButton} onClick={handleRemoveVideo} disabled={isLoading}>
                      영상 변경
                    </button>
                  </div>
                ) : (
                  <div className={styles.uploadContent}>
                    <FontAwesomeIcon icon={faUpload} className={styles.uploadIcon} />
                    <p className={styles.dropzoneTitle}>1. 발표 영상 업로드</p>
                    <p className={styles.dropzoneText}>파일을 드래그하거나 클릭하여 선택하세요</p>
                    <p className={styles.fileTypes}>지원: MP4, WebM, MOV</p>
                  </div>
                )}
              </div>
            </div>

            {/* --- Script Dropzone --- */}
            <div {...getScriptRootProps()} className={`${styles.dropzone} ${styles.scriptDropzone} ${isScriptDragActive ? styles.active : ''} ${scriptFile ? styles.hasFile : ''} ${videoFile ? styles.visible : ''}`}>
              <input {...getScriptInputProps()} />
              <div className={styles.dropzoneContentWrapper}>
                {scriptFile ? (
                  <div className={styles.fileSelectedContent}>
                    <FontAwesomeIcon icon={faFileLines} className={styles.fileIcon} />
                    <p className={styles.fileName}>{scriptFile.name}</p>
                    <p className={styles.fileSize}>{(scriptFile.size / 1024 / 1024).toFixed(2)} MB</p>
                    <button className={styles.cancelButton} onClick={handleRemoveScript} disabled={isLoading}>
                      대본 변경
                    </button>
                  </div>
                ) : (
                  <div className={styles.uploadContent}>
                    <FontAwesomeIcon icon={faFileLines} className={styles.uploadIcon} />
                    <p className={styles.dropzoneTitle}>2. 발표 대본 업로드</p>
                    <p className={styles.dropzoneText}>이곳에 대본 파일을 올려주세요</p>
                    <p className={styles.fileTypes}>지원: TXT</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {error && (
            <div className={styles.errorMessage}>
              <FontAwesomeIcon icon={faExclamationTriangle} /> {error}
            </div>
          )}

          <button className={styles.analyzeButton} onClick={handleAnalyzeClick} disabled={!videoFile || !scriptFile || isLoading}>
            {isLoading ? (
              <><FontAwesomeIcon icon={faSpinner} spin /> 분석 요청 중...</>
            ) : (
              videoFile && !scriptFile ? '대본 파일을 업로드해주세요' : '분석 시작하기'
            )}
          </button>
        </div>

        <div className={`${styles.rightColumn} ${isMounted ? styles.enter : ''}`}>
          <h1 className={styles.mainTitle}>AI 발표 코칭 솔루션</h1>
          <p className={styles.mainDescription}>
            단순한 피드백을 넘어, 당신의 발표 실력을 과학적으로 분석하고 개선 방향을 제시합니다. AI와 함께 최고의 발표를 준비하세요.
          </p>
          <div className={styles.features}>
            <div className={styles.featureItem}>
              <FontAwesomeIcon icon={faSmile} className={styles.featureIcon} />
              <div>
                <h3 className={styles.featureTitle}>표정 및 시선 분석</h3>
                <p className={styles.featureText}>불안한 시선, 무표정한 얼굴 등 청중의 몰입을 방해하는 요소를 감지합니다.</p>
              </div>
            </div>
            <div className={styles.featureItem}>
              <FontAwesomeIcon icon={faHandSparkles} className={styles.featureIcon} />
              <div>
                <h3 className={styles.featureTitle}>제스처 및 자세 분석</h3>
                <p className={styles.featureText}>불필요한 손동작이나 경직된 자세를 파악하여, 더 자연스러운 발표를 돕습니다.</p>
              </div>
            </div>
            <div className={styles.featureItem}>
              <FontAwesomeIcon icon={faVolumeUp} className={styles.featureIcon} />
              <div>
                <h3 className={styles.featureTitle}>말투 및 음성 분석</h3>
                <p className={styles.featureText}>너무 빠르거나 단조로운 목소리 톤, 잦은 필러 단어 사용을 분석합니다.</p>
              </div>
            </div>
          </div>
          <button className={styles.historyButton} onClick={onShowHistory} disabled={isLoading}>
            <FontAwesomeIcon icon={faHistory} />
            이전 분석 기록 보기
          </button>
        </div>
      </div>
    </div>
  );
};

export default VideoUpload;
