import React, { useState, useMemo } from 'react';
import styles from './NoticePage.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faThumbtack } from '@fortawesome/free-solid-svg-icons';

// 공지사항 데이터 타입 정의
interface Notice {
    id: number;
    author: string;
    content: string;
    timestamp: string;
    isPinned?: boolean;
}

// 예시 데이터
const initialNotices: Notice[] = [
    { id: 1, author: '관리자', content: '[필독] 캡스톤 디자인 최종 발표 관련 중요 안내입니다. 모든 팀원은 반드시 내용을 숙지하고 준비해주시기 바랍니다. 날짜와 시간을 정확히 확인하고, 발표 자료는 지정된 양식에 맞춰 전날까지 제출해 주시기 바랍니다.', timestamp: '2025-07-20T10:00:00', isPinned: true },
    { id: 2, author: '박서연', content: '다음 주 월요일(28일) 팀 회의는 오후 3시로 변경되었습니다. 착오 없으시길 바랍니다.', timestamp: '2025-07-22T11:00:00', isPinned: true },
    { id: 3, author: '김세현', content: '교수님께서 주신 피드백을 정리해서 올립니다. 양이 꽤 많으니 다음 회의 전까지 꼭 한번씩 읽어주세요! 피드백을 바탕으로 UI/UX 개선 방향을 다시 논의할 예정입니다.', timestamp: '2025-07-21T14:30:00' },
    { id: 4, author: '관리자', content: '프로젝트 중간 점검 및 코드 리뷰 일정을 공유합니다.', timestamp: '2025-07-19T18:00:00' },
];

const NoticePage: React.FC = () => {
    const [notices, setNotices] = useState<Notice[]>(initialNotices);
    const [expandedId, setExpandedId] = useState<number | null>(null);

    const handlePinNotice = (id: number) => {
        setNotices(
            notices.map(n => (n.id === id ? { ...n, isPinned: !n.isPinned } : n))
        );
    };

    const sortedNotices = useMemo(() => {
        return [...notices].sort((a, b) => {
            if (a.isPinned && !b.isPinned) return -1;
            if (!a.isPinned && b.isPinned) return 1;
            return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
        });
    }, [notices]);

    return (
        <div className={styles.container}>
            <div className={styles.timeline}>
                {sortedNotices.map((notice, index) => {
                    const isExpanded = expandedId === notice.id;
                    const date = new Date(notice.timestamp);
                    const dateString = `${date.getFullYear()}.${(date.getMonth() + 1).toString().padStart(2, '0')}.${date.getDate().toString().padStart(2, '0')}`;

                    const prevDate = index > 0 ? new Date(sortedNotices[index - 1].timestamp).toLocaleDateString() : null;
                    const showDate = date.toLocaleDateString() !== prevDate;


                    return (
                        <div key={notice.id} className={`${styles.timelineEntry} ${notice.isPinned ? styles.pinned : ''}`}>
                            <div className={styles.marker}>
                                {showDate && <span className={styles.dateLabel}>{dateString}</span>}
                            </div>

                            <article className={`${styles.noticeCard} ${isExpanded ? styles.expanded : ''}`}>
                                <div className={styles.cardHeader}>
                                    <span className={styles.author}>{notice.author}</span>
                                    <button
                                        title={notice.isPinned ? "고정 해제" : "고정하기"}
                                        className={styles.pinButton}
                                        onClick={() => handlePinNotice(notice.id)}
                                    >
                                        <FontAwesomeIcon icon={faThumbtack} />
                                    </button>
                                </div>
                                <div className={styles.contentWrapper}>
                                    <p className={styles.content}>{notice.content}</p>
                                </div>
                                {!isExpanded && (
                                    <button className={styles.readMoreButton} onClick={() => setExpandedId(notice.id)}>
                                        더 보기
                                    </button>
                                )}
                                {isExpanded && (
                                     <button className={styles.readMoreButton} onClick={() => setExpandedId(null)}>
                                        접기
                                    </button>
                                )}
                            </article>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default NoticePage;