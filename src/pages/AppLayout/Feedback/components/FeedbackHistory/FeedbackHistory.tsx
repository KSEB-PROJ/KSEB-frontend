import React, { useState, useMemo, useEffect, useRef } from 'react';
import styles from './FeedbackHistory.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import MainFeedbackCard from '../MainFeedbackCard/MainFeedbackCard';
import SubFeedbackCard from '../SubFeedbackCard/SubFeedbackCard';

const mockHistory = [
    { id: 4, title: '최종 발표 리허설', date: '2025-08-04', thumbnailUrl: 'https://images.unsplash.com/photo-1543269865-cbf427effbad?q=80&w=870&auto=format&fit=crop', overallScore: 76, summary: '전반적으로 안정적이었으나, 시선 처리가 불안정하고 말이 조금 빠른 경향이 있습니다.' },
    { id: 1, title: '1차 발표 피드백', date: '2025-08-03', thumbnailUrl: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?q=80&w=1032&auto=format&fit=crop', overallScore: 72, summary: '자신감 있는 목소리는 좋지만, 불필요한 손동작이 많아 내용 전달을 방해합니다.' },
    { id: 2, title: '프로젝트 중간 발표', date: '2025-07-28', thumbnailUrl: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=871&auto=format&fit=crop', overallScore: 85, summary: '내용 구성과 전달력 모두 훌륭합니다. 청중과의 상호작용을 조금 더 늘리면 완벽합니다.' },
    { id: 3, title: '팀 소개 발표', date: '2025-07-15', thumbnailUrl: 'https://images.unsplash.com/photo-1600880292210-85938a039492?q=80&w=870&auto=format&fit=crop', overallScore: 68, summary: '목소리가 작고 발표 자료에 너무 의존하는 경향이 보입니다. 자신감을 가지세요.' },
    { id: 5, title: '아이디어 피칭', date: '2025-06-20', thumbnailUrl: 'https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=870&auto=format&fit=crop', overallScore: 81, summary: '아이디어는 좋았지만, 제스처 사용이 거의 없어 설득력이 다소 부족했습니다.' },
].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

interface FeedbackHistoryProps {
  onSelect: (id: number) => void;
  onBack: () => void;
}

const FeedbackHistory: React.FC<FeedbackHistoryProps> = ({ onSelect, onBack }) => {
  const [mainCardId, setMainCardId] = useState(mockHistory[0]?.id || null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const mainCardData = useMemo(() => mockHistory.find(item => item.id === mainCardId), [mainCardId]);
  const subCardData = useMemo(() => mockHistory.filter(item => item.id !== mainCardId), [mainCardId]);

  const checkScrollability = () => {
    const el = trackRef.current;
    if (el) {
      setCanScrollLeft(el.scrollLeft > 0);
      setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth);
    }
  };

  useEffect(() => {
    const el = trackRef.current;
    if (el) {
      checkScrollability();
      el.addEventListener('scroll', checkScrollability);
      window.addEventListener('resize', checkScrollability);
      return () => {
        el.removeEventListener('scroll', checkScrollability);
        window.removeEventListener('resize', checkScrollability);
      };
    }
  }, [subCardData]);

  const handleScroll = (direction: 'left' | 'right') => {
    const el = trackRef.current;
    if (el) {
      const scrollAmount = el.clientWidth * 0.8;
      el.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
    }
  };

  const handleSubCardClick = (id: number) => {
    setMainCardId(id);
  };

  const handleAnalyzeClick = (id: number) => {
    onSelect(id);
  };

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
            onAnalyze={handleAnalyzeClick}
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
                  onClick={handleSubCardClick}
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
