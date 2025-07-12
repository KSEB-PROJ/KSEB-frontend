import React, { useState, useMemo, useRef, useLayoutEffect, useEffect } from 'react';
import styles from './NoticePage.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faThumbtack, faPen, faTrash, faTimes, faCheck } from '@fortawesome/free-solid-svg-icons';


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
    const editableContentRef = useRef<HTMLDivElement>(null);
    const [isOverflowing, setIsOverflowing] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    
    useLayoutEffect(() => {
        const el = contentRef.current;
        if (el && !isEditing) {
            const isOverflow = el.scrollHeight > el.clientHeight;
            setIsOverflowing(isOverflow);
        }
    }, [notice.content, isExpanded, isEditing]);

    useEffect(() => {
        if (isEditing && editableContentRef.current) {
            editableContentRef.current.focus();
            const range = document.createRange();
            const sel = window.getSelection();
            range.selectNodeContents(editableContentRef.current);
            range.collapse(false);
            sel?.removeAllRanges();
            sel?.addRange(range);
        }
    }, [isEditing]);

    const handleUpdate = () => {
        const newContent = editableContentRef.current?.innerText || '';
        if (newContent.trim()) {
            onUpdate(newContent);
        }
        setIsEditing(false);
    };

    const handleCancelEdit = () => {
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
            <article className={styles.noticeCard}>
                <div className={styles.cardHeader}>
                    <span className={styles.author}>{notice.author}</span>
                    <div className={styles.buttonGroup}>
                         <button title="수정" className={styles.iconButton} onClick={() => setIsEditing(true)}><FontAwesomeIcon icon={faPen} /></button>
                         <button title="삭제" className={styles.iconButton} onClick={onDelete}><FontAwesomeIcon icon={faTrash} /></button>
                         <button title={notice.isPinned ? "고정 해제" : "고정하기"} className={`${styles.iconButton} ${styles.pinButton}`} onClick={onPin}><FontAwesomeIcon icon={faThumbtack} /></button>
                    </div>
                </div>
                <div className={`${styles.contentWrapper} ${isEditing ? styles.editingWrapper : ''}`}>
                    <div
                        ref={isEditing ? editableContentRef : contentRef}
                        className={`${styles.content} ${isExpanded && !isEditing ? styles.expandedContent : ''}`}
                        contentEditable={isEditing}
                        suppressContentEditableWarning={true}
                    >
                        {notice.content}
                    </div>
                     {isEditing && (
                        <div className={styles.editActions}>
                            <button className={`${styles.actionButton} ${styles.cancelButton}`} onClick={handleCancelEdit} title="취소">
                                <FontAwesomeIcon icon={faTimes} />
                            </button>
                            <button className={`${styles.actionButton} ${styles.saveButton}`} onClick={handleUpdate} title="저장">
                                <FontAwesomeIcon icon={faCheck} />
                            </button>
                        </div>
                    )}
                    {!isEditing && (isOverflowing || isExpanded) && (
                        <button className={styles.readMoreButton} onClick={onToggleExpand}>
                            {isExpanded ? '간략히' : '더 보기'}
                        </button>
                    )}
                </div>
            </article>
        </div>
    );
};


// --- 공지사항 페이지 메인 컴포넌트 ---
const NoticePage: React.FC = () => {
    const [notices, setNotices] = useState<Notice[]>(initialNotices.filter(n => {
        return n.expiresAt ? new Date(n.expiresAt) > new Date() : true;
    }));
    const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
    const [hoveredId, setHoveredId] = useState<number | null>(null);

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
                    const prevDate = index > 0 ? new Date(sortedNotices[index - 1].timestamp).toLocaleDateString() : null;
                    const showDate = new Date(notice.timestamp).toLocaleDateString() !== prevDate;
                    return (
                        <NoticeItem
                            key={notice.id}
                            notice={notice}
                            isExpanded={expandedIds.has(notice.id)}
                            onToggleExpand={() => toggleExpand(notice.id)}
                            onPin={() => handlePinNotice(notice.id)}
                            onDelete={() => handleDeleteNotice(notice.id)}
                            onUpdate={(newContent) => handleUpdateNotice(notice.id, newContent)}
                            showDate={showDate}
                            isHovered={hoveredId === notice.id}
                            onMouseEnter={() => setHoveredId(notice.id)}
                        />
                    );
                })}
            </div>
        </div>
    );
};

export default NoticePage;