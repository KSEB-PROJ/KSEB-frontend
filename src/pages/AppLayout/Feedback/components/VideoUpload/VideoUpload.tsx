/**
 * @file VideoUpload.tsx
 * @description 피드백 기능의 시작 화면.
 * 사용자가 영상을 업로드하고, 서비스의 핵심 기능을 인지하는 역할을 함.
 * 파일 선택 시, 바로 분석을 시작하지 않고 사용자에게 확인 및 분석 시작 단계를 제공.
 */
import React, { useCallback, useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import styles from './VideoUpload.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUpload, faHistory, faSmile, faHandSparkles, faVolumeUp, faFileVideo } from '@fortawesome/free-solid-svg-icons';

interface VideoUploadProps {
  // 부모 컴포넌트(FeedbackPage)로부터 받는 콜백 함수들
  onVideoUpload: (file: File) => void; // '분석 시작' 시 호출될 함수
  onShowHistory: () => void; // '기록 보기' 시 호출될 함수
}

const VideoUpload: React.FC<VideoUploadProps> = ({ onVideoUpload, onShowHistory }) => {
  // --- 상태 관리 ---
  // 사용자가 선택했지만 아직 분석은 시작하지 않은 파일을 임시 저장하는 상태.
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  // 컴포넌트 첫 로드 시 진입 애니메이션을 제어하기 위한 상태.
  const [isMounted, setIsMounted] = useState(false);

  // 컴포넌트가 마운트된 후 짧은 지연을 주어 CSS transition이 적용되도록 함.
  useEffect(() => {
    const timer = setTimeout(() => setIsMounted(true), 100);
    return () => clearTimeout(timer); // 컴포넌트 언마운트 시 타이머 정리
  }, []);

  // --- 드롭존 로직 ---
  // 파일이 드롭되거나 선택되었을 때 호출되는 콜백.
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setSelectedFile(acceptedFiles[0]); // 선택된 파일을 내부 상태에 저장.
    }
  }, []);

  // react-dropzone 훅 초기화.
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'video/mp4': ['.mp4'], 'video/webm': ['.webm'], 'video/quicktime': ['.mov'] },
    multiple: false, // 한 번에 하나의 파일만 허용.
  });

  // --- 이벤트 핸들러 ---
  // '분석 시작하기' 버튼 클릭 핸들러.
  const handleAnalyzeClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // 중요: 클릭 이벤트가 부모(드롭존)로 전파되어 파일 선택창이 다시 뜨는 것을 방지.
    if (selectedFile) {
      onVideoUpload(selectedFile); // 부모 컴포넌트로 선택된 파일을 전달하여 분석 프로세스 시작.
    }
  };

  // '다른 영상 선택' 버튼 클릭 핸들러.
  const handleRemoveFile = (e: React.MouseEvent) => {
    e.stopPropagation(); // 이벤트 전파 방지.
    setSelectedFile(null); // 선택된 파일 상태를 초기화하여 다시 업로드 UI를 보여줌.
  };

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.gridBg}></div>
      <div className={styles.contentContainer}>
        {/* 왼쪽 컬럼: 파일 업로드 영역 */}
        <div className={`${styles.leftColumn} ${isMounted ? styles.enter : ''}`}>
          <div {...getRootProps()} className={`${styles.dropzone} ${isDragActive ? styles.active : ''}`}>
            <input {...getInputProps()} />
            {/* 조건부 렌더링: 선택된 파일이 없으면 업로드 UI, 있으면 파일 정보 및 분석 시작 UI를 보여줌 */}
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

        {/* 오른쪽 컬럼: 서비스 소개 영역 */}
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
