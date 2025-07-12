import React, { useState, useMemo, useRef, useLayoutEffect } from 'react';
import styles from './NoticePage.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faThumbtack, faPen, faTrash, faChevronDown, faChevronUp } from '@fortawesome/free-solid-svg-icons';

// --- 데이터 타입 및 예시 데이터 ---
interface Notice {
    id: number;
    author: string;
    content: string;
    timestamp: string;
    isPinned?: boolean;
    expiresAt?: string | null;
}
// 예시 데이터의 만료일을 모두 미래 시점으로 수정
const initialNotices: Notice[] = [
    { id: 1, author: '관리자', content: '[필독] 캡스톤 디자인 최종 발표 관련 중요 안내입니다. 모든 팀원은 반드시 내용을 숙지하고 준비해주시기 바랍니다. 날짜와 시간을 정확히 확인하고, 발표 자료는 지정된 양식에 맞춰 전날까지 제출해 주시기 바랍니다.', timestamp: '2025-07-10T10:00:00', isPinned: true, expiresAt: '2025-08-10T23:59:59' },
    { id: 2, author: '박서연', content: '다음 주 월요일(28일) 팀 회의는 오후 3시로 변경되었습니다. 착오 없으시길 바랍니다.', timestamp: '2025-07-11T11:00:00', isPinned: true, expiresAt: null },
    { id: 3, author: '김세현', content: '교수님께서 주신 피드백을 정리해서 올립니다. 양이 꽤 많으니 다음 회의 전까지 꼭 한번씩 읽어주세요! 피드백을 바탕으로 UI/UX 개선 방향을 다시 논의할 예정입니다.', timestamp: '2025-07-01T14:30:00', expiresAt: '2025-07-30T23:59:59' },
    { id: 4, author: '관리자', content: '프로젝트 중간 점검 및 코드 리뷰 일정을 공유합니다.', timestamp: '2025-07-10T18:00:00', expiresAt: '2025-07-24T23:59:59' },
    { id: 5, author: '이예진', content: '지난 회의록입니다. 확인 후 피드백 주세요.', timestamp: '2025-07-01T10:00:00', expiresAt: '2025-07-28T23:59:59' },
];


// ✨ '시간의 고리' & '시간의 결정' 마커 컴포넌트
const Marker: React.FC<{ notice: Notice, isHovered: boolean }> = ({ notice, isHovered }) => {
    const now = new Date();
    const hasLifespan = !!notice.expiresAt;
    const isInfinite = !notice.expiresAt;

    const [tooltip, setTooltip] = useState({ visible: false, text: '', isDanger: false, isInfo: false });

    const getProgressProps = () => {
        if (!hasLifespan) return null;

        const start = new Date(notice.timestamp);
        const end = new Date(notice.expiresAt!);
        const totalDuration = end.getTime() - start.getTime();

        if (totalDuration <= 0) return null;
        
        const timePassed = now.getTime() - start.getTime();
        const progress = Math.min(1, timePassed / totalDuration);

        let statusClass = styles.safe;
        if (progress > 0.85) statusClass = styles.danger;
        else if (progress > 0.6) statusClass = styles.warning;

        const circumference = 2 * Math.PI * 8;
        const strokeDashoffset = circumference * (1 - progress);

        return { statusClass, circumference, strokeDashoffset, progress };
    };

    const progressProps = getProgressProps();

    const handleMouseEnter = () => {
        if (hasLifespan) {
            const end = new Date(notice.expiresAt!);
            const diffTime = end.getTime() - now.getTime();
            const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            setTooltip({
                visible: true,
                text: `D-${daysRemaining}`,
                isDanger: progressProps?.statusClass === styles.danger,
                isInfo: false,
            });
        } else if (isInfinite) {
            setTooltip({
                visible: true,
                text: '영구 공지',
                isDanger: false,
                isInfo: true
            });
        }
    };
    
    const handleMouseLeave = () => {
        setTooltip({ visible: false, text: '', isDanger: false, isInfo: false });
    };

    return (
        <div 
            className={styles.markerContainer} 
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <div className={`${styles.markerBase} ${isHovered ? styles.hoverActive : ''}`} />
            {progressProps && (
                 <svg className={styles.markerSvg} viewBox="0 0 22 22">
                    <circle
                        className={`${styles.markerProgress} ${progressProps.statusClass}`}
                        cx="11" cy="11" r="8"
                        strokeDasharray={progressProps.circumference}
                        strokeDashoffset={progressProps.strokeDashoffset}
                    />
                </svg>
            )}
            
            {tooltip.visible && (
                 <div className={`${styles.tooltip} ${tooltip.isDanger ? styles.tooltipDanger : ''} ${tooltip.isInfo ? styles.tooltipInfo : ''}`}>
                    {tooltip.text}
                 </div>
            )}
        </div>
    );
};


// --- 개별 공지사항 아이템 컴포넌트 ---
const NoticeItem: React.FC<{
    notice: Notice;
    isExpanded: boolean;
    onToggleExpand: () => void;
    onPin: () => void;
    onDelete: () => void;
    onUpdate: (newContent: string) => void;
    showDate: boolean;
    isHovered: boolean;
    onMouseEnter: () => void;
}> = ({ notice, isExpanded, onToggleExpand, onPin, onDelete, onUpdate, showDate, isHovered, onMouseEnter }) => {
    const contentRef = useRef<HTMLParagraphElement>(null);
    const [isOverflowing, setIsOverflowing] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editedContent, setEditedContent] = useState(notice.content);
    const [heights, setHeights] = useState({ collapsed: '68px', full: '68px' });

    useLayoutEffect(() => {
        const el = contentRef.current;
        if (el && !isEditing) {
            const collapsedHeight = el.clientHeight;
            const fullHeight = el.scrollHeight;
            setHeights({ collapsed: `${collapsedHeight}px`, full: `${fullHeight}px` });
            setIsOverflowing(fullHeight > collapsedHeight);
        }
    }, [notice.content, isEditing]);

    const handleUpdate = () => {
        onUpdate(editedContent);
        setIsEditing(false);
    };

    const date = new Date(notice.timestamp);
    const dateString = `${date.getFullYear()}.${(date.getMonth() + 1).toString().padStart(2, '0')}.${date.getDate().toString().padStart(2, '0')}`;

    return (
        <div 
            className={`${styles.timelineEntry} ${notice.isPinned ? styles.pinned : ''}`}
            onMouseEnter={onMouseEnter}
        >
            <Marker notice={notice} isHovered={isHovered} />
            {showDate && <span className={styles.dateLabel}>{dateString}</span>}
            <article className={`${styles.noticeCard}`}>
                <div className={styles.cardHeader}>
                    <span className={styles.author}>{notice.author}</span>
                    <div className={styles.buttonGroup}>
                         <button title="수정" className={styles.iconButton} onClick={() => setIsEditing(!isEditing)}><FontAwesomeIcon icon={faPen} /></button>
                         <button title="삭제" className={styles.iconButton} onClick={onDelete}><FontAwesomeIcon icon={faTrash} /></button>
                         <button title={notice.isPinned ? "고정 해제" : "고정하기"} className={`${styles.iconButton} ${styles.pinButton}`} onClick={onPin}><FontAwesomeIcon icon={faThumbtack} /></button>
                    </div>
                </div>
                 {isEditing ? (
                    <div className={styles.editWrapper}>
                        <textarea className={styles.editTextarea} value={editedContent} onChange={(e) => setEditedContent(e.target.value)} rows={5} autoFocus />
                        <button className={styles.saveButton} onClick={handleUpdate}>저장</button>
                    </div>
                ) : (
                    <>
                        <div className={styles.contentWrapper} style={{ maxHeight: isExpanded ? heights.full : heights.collapsed }}>
                            <p ref={contentRef} className={`${styles.content} ${isExpanded ? styles.expandedContent : ''}`}>{notice.content}</p>
                        </div>
                        {(isOverflowing || isExpanded) && (
                            <button className={styles.readMoreButton} onClick={onToggleExpand}>
                                {isExpanded ? '접기' : '더 보기'}
                                <FontAwesomeIcon icon={isExpanded ? faChevronUp : faChevronDown} />
                            </button>
                        )}
                    </>
                )}
            </article>
        </div>
    );
};


// --- 공지사항 페이지 메인 컴포넌트 ---
const NoticePage: React.FC = () => {
    const [notices, setNotices] = useState<Notice[]>(initialNotices.filter(n => {
        // 만료일이 있는 공지는 현재 시간보다 이후인 것만 필터링
        return n.expiresAt ? new Date(n.expiresAt) > new Date() : true;
    }));
    const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
    const [hoveredId, setHoveredId] = useState<number | null>(null);
    const [lineStyle, setLineStyle] = useState({});

    const timelineRef = useRef<HTMLDivElement>(null);
    const entryRefs = useRef<Record<number, HTMLDivElement | null>>({});

    const handlePinNotice = (id: number) => {
        setNotices(notices.map(n => (n.id === id ? { ...n, isPinned: !n.isPinned } : n)));
    };
    const handleDeleteNotice = (id: number) => {
        if (window.confirm('정말 이 공지를 삭제하시겠습니까?')) {
            setNotices(notices.filter(n => n.id !== id));
        }
    };
    const handleUpdateNotice = (id: number, newContent: string) => {
        setNotices(notices.map(n => (n.id === id ? { ...n, content: newContent } : n)));
    };
    const toggleExpand = (id: number) => {
        setExpandedIds(prevIds => {
            const newIds = new Set(prevIds);
            if (newIds.has(id)) newIds.delete(id);
            else newIds.add(id);
            return newIds;
        });
    };

    const handleMouseEnter = (id: number) => {
        if (!timelineRef.current || !entryRefs.current[id]) return;

        const timelineRect = timelineRef.current.getBoundingClientRect();
        const entryRect = entryRefs.current[id]!.getBoundingClientRect();
        
        const markerTop = entryRect.top - timelineRect.top + 5 + (18 / 2);

        setLineStyle({
            top: `${markerTop}px`,
            height: `calc(100% - ${markerTop}px)`,
            opacity: 1,
        });
        setHoveredId(id);
    };

    const handleMouseLeave = () => {
        setLineStyle(prev => ({ ...prev, opacity: 0 }));
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
            <div className={styles.timeline} ref={timelineRef} onMouseLeave={handleMouseLeave}>
                <div className={styles.animatedLine} style={lineStyle} />
                {sortedNotices.map((notice, index) => {
                    const prevDate = index > 0 ? new Date(sortedNotices[index - 1].timestamp).toLocaleDateString() : null;
                    const showDate = new Date(notice.timestamp).toLocaleDateString() !== prevDate;
                    return (
                        <div key={notice.id} ref={el => { entryRefs.current[notice.id] = el; }}>
                            <NoticeItem
                                notice={notice}
                                isExpanded={expandedIds.has(notice.id)}
                                onToggleExpand={() => toggleExpand(notice.id)}
                                onPin={() => handlePinNotice(notice.id)}
                                onDelete={() => handleDeleteNotice(notice.id)}
                                onUpdate={(newContent) => handleUpdateNotice(notice.id, newContent)}
                                showDate={showDate}
                                isHovered={hoveredId === notice.id}
                                onMouseEnter={() => handleMouseEnter(notice.id)}
                            />
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default NoticePage;