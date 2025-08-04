/**
 * @file FeedbackHistory.tsx
 * @description 과거 피드백 기록들을 브라우징하는 페이지 컴포넌트.
 * 메인 카드와 서브 카드 UI를 통해 기록을 시각적으로 보여주고, 선택 시 분석 페이지로 이동.
 * 현재는 mock 데이터를 사용하며, 추후 API 연동 필요.
 */
import React, { useState, useMemo, useEffect, useRef } from 'react';
import styles from './FeedbackHistory.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import MainFeedbackCard from '../MainFeedbackCard/MainFeedbackCard';
import SubFeedbackCard from '../SubFeedbackCard/SubFeedbackCard';

// TODO: API 연동 시 제거될 mock 데이터. 날짜 내림차순으로 정렬.
const mockHistory = [
    { id: 4, title: '최종 발표 리허설', date: '2025-08-04', thumbnailUrl: 'https://images.unsplash.com/photo-1543269865-cbf427effbad?q=80&w=870&auto=format&fit=crop', overallScore: 76, summary: '전반적으로 안정적이었으나, 시선 처리가 불안정하고 말이 조금 빠른 경향이 있습니다.' },
    { id: 1, title: '1차 발표 피드백', date: '2025-08-03', thumbnailUrl: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?q=80&w=1032&auto=format&fit=crop', overallScore: 72, summary: '자신감 있는 목소리는 좋지만, 불필요한 손동작이 많아 내용 전달을 방해합니다.' },
    { id: 2, title: '프로젝트 중간 발표', date: '2025-07-28', thumbnailUrl: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=871&auto=format&fit=crop', overallScore: 85, summary: '내용 구성과 전달력 모두 훌륭합니다. 청중과의 상호작용을 조금 더 늘리면 완벽합니다.' },
    { id: 3, title: '팀 소개 발표', date: '2025-07-15', thumbnailUrl: 'https://images.unsplash.com/photo-1600880292210-85938a039492?q=80&w=870&auto=format&fit=crop', overallScore: 68, summary: '목소리가 작고 발표 자료에 너무 의존하는 경향이 보입니다. 자신감을 가지세요.' },
    { id: 5, title: '아이디어 피칭', date: '2025-06-20', thumbnailUrl: 'https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=870&auto=format&fit=crop', overallScore: 81, summary: '아이디어는 좋았지만, 제스처 사용이 거의 없어 설득력이 다소 부족했습니다.' },
].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

interface FeedbackHistoryProps {
  onSelect: (id: number) => void; // 분석할 기록 ID를 부모로 전달하는 콜백
  onBack: () => void; // 이전 화면(업로드)으로 돌아가는 콜백
}

const FeedbackHistory: React.FC<FeedbackHistoryProps> = ({ onSelect, onBack }) => {
  // --- 상태 관리 ---
  // 현재 메인 카드에 보여줄 기록의 ID. 기본값은 가장 최신 기록.
  const [mainCardId, setMainCardId] = useState(mockHistory[0]?.id || null);
  // 하단 서브 카드 스크롤 영역을 참조하기 위한 ref.
  const trackRef = useRef<HTMLDivElement>(null);
  // 좌/우 스크롤 버튼의 표시 여부를 결정하는 상태.
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // --- 데이터 메모이제이션 ---
  // mainCardId가 변경될 때만 메인 카드 데이터를 다시 계산.
  const mainCardData = useMemo(() => mockHistory.find(item => item.id === mainCardId), [mainCardId]);
  // mainCardId가 변경될 때만 서브 카드 데이터 리스트를 다시 계산.
  const subCardData = useMemo(() => mockHistory.filter(item => item.id !== mainCardId), [mainCardId]);

  // --- 스크롤 로직 ---
  // 현재 스크롤 위치를 기준으로 좌/우 스크롤 가능 여부를 판단하고 상태를 업데이트.
  const checkScrollability = () => {
    const el = trackRef.current;
    if (el) {
      setCanScrollLeft(el.scrollLeft > 0);
      setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth);
    }
  };

  // 컴포넌트 마운트 시, 그리고 데이터 변경 시 스크롤 가능 여부를 체크하고 이벤트 리스너를 등록.
  useEffect(() => {
    const el = trackRef.current;
    if (el) {
      checkScrollability();
      el.addEventListener('scroll', checkScrollability);
      window.addEventListener('resize', checkScrollability);
      // 클린업 함수: 컴포넌트 언마운트 시 이벤트 리스너 제거.
      return () => {
        el.removeEventListener('scroll', checkScrollability);
        window.removeEventListener('resize', checkScrollability);
      };
    }
  }, [subCardData]); // subCardData가 바뀔 때마다 이펙트를 재실행하여 스크롤 상태를 정확히 계산.

  // 좌/우 버튼 클릭 시 스크롤을 부드럽게 이동시키는 핸들러.
  const handleScroll = (direction: 'left' | 'right') => {
    const el = trackRef.current;
    if (el) {
      const scrollAmount = el.clientWidth * 0.8; // 한 번에 화면 너비의 80%만큼 스크롤.
      el.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
    }
  };

  // --- 이벤트 핸들러 ---
  // 서브 카드를 클릭했을 때, 해당 카드를 메인 카드로 변경.
  const handleSubCardClick = (id: number) => {
    setMainCardId(id);
  };

  // 메인 카드에서 '분석 보기' 버튼을 클릭했을 때, 부모 컴포넌트로 ID를 전달.
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
        {/* 스크롤 가능 여부에 따라 버튼을 조건부 렌더링 */}
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
