/**
 * @file FeedbackHistory.tsx
 * @description 과거 피드백 기록들을 API 연동을 통해 브라우징하는 페이지 컴포넌트.
 */
import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import styles from './FeedbackHistory.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faChevronLeft, faChevronRight, faSpinner, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import MainFeedbackCard from '../MainFeedbackCard/MainFeedbackCard';
import SubFeedbackCard from '../SubFeedbackCard/SubFeedbackCard';
import { getMyAnalysisIds, getAnalysisResultById } from '../../../../../api/feedbackApi';
import { transformAnalysisData } from '../../../../../utils/feedbackDataTransformer';

// API로부터 받은 분석 요약 정보의 타입
interface HistoryItem {
  id: number;
  title: string;
  date: string;
  thumbnailUrl: string;
  overallScore: number;
  summary: string;
}

interface FeedbackHistoryProps {
  onSelect: (id: number) => void;
  onBack: () => void;
}

const FeedbackHistory: React.FC<FeedbackHistoryProps> = ({ onSelect, onBack }) => {
  // --- 상태 관리 ---
  const [histories, setHistories] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mainCardId, setMainCardId] = useState<number | null>(null);
  
  const trackRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // --- 데이터 로딩 ---
  useEffect(() => {
    const fetchHistories = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const { video_ids } = await getMyAnalysisIds();
        if (video_ids.length === 0) {
          setHistories([]);
          setIsLoading(false);
          return;
        }

        const historyPromises = video_ids.map(id => 
          getAnalysisResultById(id).catch(err => {
            console.warn(`ID ${id} 분석 결과 로딩 실패:`, err);
            return null; // 실패한 요청은 null로 처리
          })
        );
        const results = await Promise.all(historyPromises);
        const validResults = results.filter(res => res !== null); // null이 아닌 결과만 필터링

        const formattedHistories = validResults.map(data => {
          if (!data) return null; // 데이터가 null인 경우를 대비
          const transformed = transformAnalysisData(data);
          // 첫 번째 프레임의 이미지 URL을 썸네일로 사용, 없으면 로컬 기본 이미지
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const thumbnailUrl = (data.poses as any)?.[0]?.image_url || '/placeholder.svg';
          
          return {
            id: data.video.id,
            title: data.video.title,
            date: new Date(data.video.upload_time).toLocaleDateString('ko-KR'),
            thumbnailUrl: thumbnailUrl,
            overallScore: transformed.overallScore,
            summary: data.feedback.short_feedback,
          };
        }).filter((item): item is HistoryItem => item !== null);
        
        formattedHistories.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        setHistories(formattedHistories);
        if (formattedHistories.length > 0) {
          setMainCardId(formattedHistories[0].id);
        }

      } catch (err) {
        setError("분석 기록을 불러오는 중 오류가 발생했습니다.");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistories();
  }, []);

  // --- 데이터 메모이제이션 ---
  const mainCardData = useMemo(() => histories.find(item => item.id === mainCardId), [mainCardId, histories]);
  const subCardData = useMemo(() => histories.filter(item => item.id !== mainCardId), [mainCardId, histories]);

  // --- 스크롤 로직 ---
  const checkScrollability = useCallback(() => {
    const el = trackRef.current;
    if (el) {
      const isScrollable = el.scrollWidth > el.clientWidth;
      setCanScrollLeft(isScrollable && el.scrollLeft > 0);
      setCanScrollRight(isScrollable && el.scrollLeft < el.scrollWidth - el.clientWidth -1);
    }
  }, []);

  useEffect(() => {
    const el = trackRef.current;
    if (el) {
      checkScrollability();
      const debouncedCheck = setTimeout(checkScrollability, 100); // 데이터 렌더링 후 잠시 뒤 체크
      
      el.addEventListener('scroll', checkScrollability);
      window.addEventListener('resize', checkScrollability);
      
      return () => {
        clearTimeout(debouncedCheck);
        el.removeEventListener('scroll', checkScrollability);
        window.removeEventListener('resize', checkScrollability);
      };
    }
  }, [subCardData, checkScrollability]);

  const handleScroll = (direction: 'left' | 'right') => {
    const el = trackRef.current;
    if (el) {
      const scrollAmount = el.clientWidth * 0.8;
      el.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
    }
  };

  // --- 렌더링 로직 ---
  if (isLoading) {
    return <div className={styles.statusContainer}><FontAwesomeIcon icon={faSpinner} spin /> 로딩 중...</div>;
  }

  if (error) {
    return <div className={styles.statusContainer}><FontAwesomeIcon icon={faExclamationTriangle} /> {error}</div>;
  }

  if (histories.length === 0) {
    return (
        <div className={styles.boardContainer}>
            <div className={styles.header}>
                <h2 className={styles.title}>피드백 브리핑</h2>
                <button className={styles.backButton} onClick={onBack}>
                <FontAwesomeIcon icon={faArrowLeft} />
                새 분석 시작하기
                </button>
            </div>
            <div className={styles.statusContainer}>분석 기록이 없습니다.</div>
        </div>
    );
  }

  return (
    <div className={styles.boardContainer}>
      <div className={styles.header}>
        <h2 className={styles.title}>피드백 브리핑</h2>
        <button className={styles.backButton} onClick={onBack}>
          <FontAwesomeIcon icon={faArrowLeft} />
          새 분석 시작하기
        </button>
      </div>

      <div className={styles.mainCardArea}>
        {mainCardData && (
          <MainFeedbackCard
            key={mainCardData.id}
            id={mainCardData.id}
            title={mainCardData.title}
            date={mainCardData.date}
            thumbnailUrl={mainCardData.thumbnailUrl}
            overallScore={mainCardData.overallScore}
            summary={mainCardData.summary}
            onAnalyze={() => onSelect(mainCardData.id)}
          />
        )}
      </div>

      <div className={styles.subCardContainer}>
        {canScrollLeft && (
          <button className={`${styles.scrollButton} ${styles.left}`} onClick={() => handleScroll('left')}>
            <FontAwesomeIcon icon={faChevronLeft} />
          </button>
        )}
        <div className={styles.subCardTrack} ref={trackRef}>
          <div className={styles.subCardWrapper}>
              {subCardData.map(item => (
              <SubFeedbackCard
                  key={item.id}
                  id={item.id}
                  title={item.title}
                  date={item.date}
                  thumbnailUrl={item.thumbnailUrl}
                  overallScore={item.overallScore}
                  onClick={() => setMainCardId(item.id)}
              />
              ))}
          </div>
        </div>
        {canScrollRight && (
          <button className={`${styles.scrollButton} ${styles.right}`} onClick={() => handleScroll('right')}>
            <FontAwesomeIcon icon={faChevronRight} />
          </button>
        )}
      </div>
    </div>
  );
};

export default FeedbackHistory;
