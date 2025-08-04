import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import styles from './VideoUpload.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUpload, faHistory, faSmile, faHandSparkles, faVolumeUp, faFileVideo } from '@fortawesome/free-solid-svg-icons';

interface VideoUploadProps {
  onVideoUpload: (file: File) => void;
  onShowHistory: () => void;
}

const VideoUpload: React.FC<VideoUploadProps> = ({ onVideoUpload, onShowHistory }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setSelectedFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'video/mp4': ['.mp4'], 'video/webm': ['.webm'], 'video/quicktime': ['.mov'] },
    multiple: false,
  });

  const handleAnalyzeClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // 이벤트 버블링 방지
    if (selectedFile) {
      onVideoUpload(selectedFile);
    }
  };

  const handleRemoveFile = (e: React.MouseEvent) => {
    e.stopPropagation(); // 이벤트 버블링 방지
    setSelectedFile(null);
  };

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.gridBg}></div>
      <div className={styles.contentContainer}>
        {/* Left Column */}
        <div className={styles.leftColumn}>
          <div {...getRootProps()} className={`${styles.dropzone} ${isDragActive ? styles.active : ''}`}>
            <input {...getInputProps()} />
            {!selectedFile ? (
              <div className={styles.uploadContent}>
                <FontAwesomeIcon icon={faUpload} className={styles.uploadIcon} />
                <p className={styles.dropzoneTitle}>분석할 영상 업로드</p>
                <p className={styles.dropzoneText}>
                  파일을 드래그 앤 드롭하거나, <br />
                  이곳을 클릭하여 직접 선택하세요.
                </p>
                <p className={styles.fileTypes}>지원 포맷: MP4, WebM, MOV</p>
              </div>
            ) : (
              <div className={styles.fileSelectedContent}>
                <FontAwesomeIcon icon={faFileVideo} className={styles.fileIcon} />
                <p className={styles.fileName}>{selectedFile.name}</p>
                <p className={styles.fileSize}>{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                <button className={styles.analyzeButton} onClick={handleAnalyzeClick}>
                  분석 시작하기
                </button>
                <button className={styles.cancelButton} onClick={handleRemoveFile}>
                  다른 영상 선택
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className={styles.rightColumn}>
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

          <button className={styles.historyButton} onClick={onShowHistory}>
            <FontAwesomeIcon icon={faHistory} />
            이전 분석 기록 보기
          </button>
        </div>
      </div>
    </div>
  );
};

export default VideoUpload;
