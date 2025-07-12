import React, { useState, useMemo, useRef, useLayoutEffect, useEffect } from 'react';
import styles from './NoticePage.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faThumbtack, faPen, faTrash, faTimes, faCheck, faCalendarAlt, faTimesCircle } from '@fortawesome/free-solid-svg-icons';

// --- 데이터 타입 및 예시 데이터 ---
interface Notice {
    id: number;
    author: string;
    content: string;
    timestamp: string;
    isPinned?: boolean;
    expiresAt?: string | null;
    originChannel?: string;
}

const initialNotices: Notice[] = [
    { id: 1, author: '관리자', content: '[필독] 캡스톤 디자인 최종 발표 관련 중요 안내입니다...', timestamp: '2025-07-10T10:00:00', isPinned: true, expiresAt: '2025-08-10T23:59:59' },
    { id: 2, author: '박서연', content: '다음 주 월요일(28일) 팀 회의는 오후 3시로 변경...', timestamp: '2025-07-11T11:00:00', isPinned: true, expiresAt: null, originChannel: '#일반' },
    { id: 3, author: '김세현', content: '교수님께서 주신 피드백을 정리해서 올립니다...', timestamp: '2025-07-01T14:30:00', expiresAt: '2025-07-30T23:59:59', originChannel: '#회의록'},
];

// --- 컴포넌트들 ---

const Marker: React.FC<{ notice: Notice; isHovered: boolean; }> = ({ notice, isHovered }) => {
    const now = new Date();
    const hasLifespan = !!notice.expiresAt;
    const isInfinite = !notice.expiresAt;

    const [tooltip, setTooltip] = useState({ visible: false, text: '', isDanger: false, isInfo: false });

    const getProgressProps = () => {
        if (!hasLifespan) return null;
        const start = new Date(notice.timestamp).getTime();
        const end = new Date(notice.expiresAt!).getTime();
        const nowTime = now.getTime();
        const totalDuration = end - start;
        if (totalDuration <= 0) return null;
        const remainingTime = end - nowTime;
        if (remainingTime <= 0) return null;
        const progress = remainingTime / totalDuration;
        let statusClass = styles.safe;
        if (progress < 0.15) statusClass = styles.danger;
        else if (progress < 0.4) statusClass = styles.warning;
        const circumference = 2 * Math.PI * 8;
        const strokeDashoffset = circumference * (1 - progress);
        return { statusClass, circumference, strokeDashoffset };
    };

    const progressProps = getProgressProps();

    const handleMouseEnter = () => {
        if (hasLifespan) {
            const end = new Date(notice.expiresAt!);
            const diffTime = end.getTime() - now.getTime();
            const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            setTooltip({ visible: true, text: `D-${daysRemaining}`, isDanger: progressProps?.statusClass === styles.danger, isInfo: false });
        } else if (isInfinite) {
            setTooltip({ visible: true, text: '영구 공지', isDanger: false, isInfo: true });
        }
    };
    
    const handleMouseLeave = () => setTooltip({ visible: false, text: '', isDanger: false, isInfo: false });

    return (
        <div className={styles.markerContainer} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
            <div className={`${styles.markerBase} ${isHovered ? styles.hoverActive : ''} ${isInfinite ? styles.infiniteMarker : ''}`} />
            {progressProps && (
                <svg className={styles.markerSvg} viewBox="0 0 22 22">
                    <circle className={`${styles.markerProgress} ${progressProps.statusClass}`} cx="11" cy="11" r="8" strokeDasharray={progressProps.circumference} strokeDashoffset={progressProps.strokeDashoffset} />
                </svg>
            )}
            {tooltip.visible && <div className={`${styles.tooltip} ${tooltip.isDanger ? styles.tooltipDanger : ''} ${tooltip.isInfo ? styles.tooltipInfo : ''}`}>{tooltip.text}</div>}
        </div>
    );
};

// ▼▼▼ 오류 수정 부분: DatePicker를 독립된 컴포넌트로 정의 ▼▼▼
const DatePicker = ({ value, onChange }: { value: string | null, onChange: (value: string | null) => void }) => {
    const dateInputRef = useRef<HTMLInputElement>(null);
    const getLocalDate = (isoDate: string | null) => isoDate ? isoDate.split('T')[0] : '';
    
    return (
        <div className={styles.datePickerContainer}>
            <button className={styles.datePickerButton} onClick={() => dateInputRef.current?.showPicker()} title="만료일 설정">
                <FontAwesomeIcon icon={faCalendarAlt} />
            </button>
            <input ref={dateInputRef} type="date" className={styles.dateInput} value={getLocalDate(value)} onChange={(e) => onChange(e.target.value ? new Date(e.target.value).toISOString() : null)} />
            {value && <span className={styles.dateDisplay}>{getLocalDate(value)}</span>}
            {value && <button className={styles.clearDateButton} onClick={() => onChange(null)} title="만료일 삭제"><FontAwesomeIcon icon={faTimesCircle} /></button>}
        </div>
    );
};
// ▲▲▲ 오류 수정 부분 ▲▲▲

const NoticeItem: React.FC<{
    notice: Notice; isExpanded: boolean; isEditing: boolean;
    onToggleExpand: () => void; onStartEdit: () => void; onEndEdit: () => void;
    onPin: () => void; onDelete: () => void; onUpdate: (data: Partial<Notice>) => void;
    showDate: boolean; isHovered: boolean; onMouseEnter: () => void;
}> = ({ notice, isExpanded, isEditing, onToggleExpand, onStartEdit, onEndEdit, onPin, onDelete, onUpdate, showDate, isHovered, onMouseEnter }) => {
    const editableContentRef = useRef<HTMLDivElement>(null);
    const [isOverflowing, setIsOverflowing] = useState(false);
    const [editedExpiresAt, setEditedExpiresAt] = useState<string | null>(notice.expiresAt || null);

    useLayoutEffect(() => {
        if (editableContentRef.current && !isEditing) {
            setIsOverflowing(editableContentRef.current.scrollHeight > editableContentRef.current.clientHeight);
        }
    }, [notice.content, isExpanded, isEditing]);

    useEffect(() => {
        if (isEditing) {
            setEditedExpiresAt(notice.expiresAt || null);
            if (editableContentRef.current) {
                editableContentRef.current.focus();
                const range = document.createRange();
                const sel = window.getSelection();
                range.selectNodeContents(editableContentRef.current);
                range.collapse(false);
                sel?.removeAllRanges();
                sel?.addRange(range);
            }
        }
    }, [isEditing, notice.expiresAt]);

    const handleUpdate = () => {
        const newContent = editableContentRef.current?.innerText || '';
        onUpdate({ content: newContent, expiresAt: editedExpiresAt });
        onEndEdit();
    };

    const date = new Date(notice.timestamp);
    const dateString = `${date.getFullYear()}.${(date.getMonth() + 1).toString().padStart(2, '0')}.${date.getDate().toString().padStart(2, '0')}`;

    return (
        <div className={`${styles.timelineEntry} ${notice.isPinned ? styles.pinned : ''}`} onMouseEnter={onMouseEnter}>
            <Marker notice={notice} isHovered={isHovered} />
            {showDate && <span className={styles.dateLabel}>{dateString}</span>}
            <article className={styles.noticeCard}>
                <div className={styles.cardHeader}>
                    <div className={styles.authorGroup}>
                        <span className={styles.author}>{notice.author}</span>
                        {notice.originChannel && <span className={styles.originChannel}>{notice.originChannel}</span>}
                    </div>
                    <div className={styles.buttonGroup}>
                        <button title="수정" className={styles.iconButton} onClick={onStartEdit}><FontAwesomeIcon icon={faPen} /></button>
                        <button title="삭제" className={styles.iconButton} onClick={() => onDelete()}><FontAwesomeIcon icon={faTrash} /></button>
                        <button title={notice.isPinned ? "고정 해제" : "고정하기"} className={`${styles.iconButton} ${styles.pinButton}`} onClick={onPin}><FontAwesomeIcon icon={faThumbtack} /></button>
                    </div>
                </div>
                <div className={`${styles.contentWrapper} ${isEditing ? styles.editingWrapper : ''}`}>
                    <div ref={editableContentRef} className={`${styles.content} ${isExpanded && !isEditing ? styles.expandedContent : ''}`}
                        contentEditable={isEditing} suppressContentEditableWarning={true} data-placeholder="공지 내용을 입력하세요...">
                        {notice.content}
                    </div>
                    {isEditing ? (
                        <div className={styles.editActions}>
                            <button className={`${styles.actionButton} ${styles.cancelButton}`} onClick={onEndEdit} title="취소"><FontAwesomeIcon icon={faTimes} /></button>
                            <DatePicker value={editedExpiresAt} onChange={setEditedExpiresAt} />
                            <button className={`${styles.actionButton} ${styles.saveButton}`} onClick={handleUpdate} title="저장"><FontAwesomeIcon icon={faCheck} /></button>
                        </div>
                    ) : (
                        (isOverflowing || isExpanded) && (
                            <button className={styles.readMoreButton} onClick={onToggleExpand}>{isExpanded ? '간략히' : '더 보기'}</button>
                        )
                    )}
                </div>
            </article>
        </div>
    );
};

const NoticePage: React.FC = () => {
    const [notices, setNotices] = useState<Notice[]>(initialNotices);
    const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
    const [editingId, setEditingId] = useState<number | null>(null);
    const [hoveredId, setHoveredId] = useState<number | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [newNoticeContent, setNewNoticeContent] = useState("");
    const [newNoticeExpiresAt, setNewNoticeExpiresAt] = useState<string | null>(null);

    const handlePinNotice = (id: number) => setNotices(notices.map(n => (n.id === id ? { ...n, isPinned: !n.isPinned } : n)));
    const handleDeleteNotice = (id: number) => {
        if (window.confirm('정말 이 공지를 삭제하시겠습니까?')) {
            setNotices(notices.filter(n => n.id !== id));
        }
    };
    const handleUpdateNotice = (id: number, data: Partial<Notice>) => {
        setNotices(notices.map(n => (n.id === id ? { ...n, ...data } : n)));
    };
    const toggleExpand = (id: number) => setExpandedIds(prev => {
        const newIds = new Set(prev);
        if (newIds.has(id)) newIds.delete(id); else newIds.add(id);
        return newIds;
    });

    const handleCreateNotice = () => {
        if (!newNoticeContent.trim()) {
            alert("공지 내용을 입력해주세요.");
            return;
        }
        const newNotice: Notice = {
            id: Date.now(),
            author: "CurrentUser",
            content: newNoticeContent,
            timestamp: new Date().toISOString(),
            expiresAt: newNoticeExpiresAt,
        };
        setNotices(prev => [newNotice, ...prev]);
        setIsCreating(false);
        setNewNoticeContent("");
        setNewNoticeExpiresAt(null);
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
                <div className={`${styles.timelineEntry} ${styles.creatorEntry}`}>
                    <div className={styles.creatorMarker} onClick={() => !isCreating && setIsCreating(true)}></div>
                    {isCreating ? (
                        <div className={`${styles.noticeCard} ${styles.creatingCard}`}>
                             <div className={`${styles.contentWrapper} ${styles.editingWrapper}`}>
                                <div className={styles.content} contentEditable={true} suppressContentEditableWarning={true}
                                     onInput={(e) => setNewNoticeContent(e.currentTarget.innerText)} data-placeholder="공지 내용을 입력하세요..." autoFocus>
                                </div>
                                <div className={styles.editActions}>
                                    <button className={`${styles.actionButton} ${styles.cancelButton}`} onClick={() => setIsCreating(false)} title="취소"><FontAwesomeIcon icon={faTimes} /></button>
                                    <DatePicker value={newNoticeExpiresAt} onChange={setNewNoticeExpiresAt} />
                                    <button className={`${styles.actionButton} ${styles.saveButton}`} onClick={handleCreateNotice} title="저장"><FontAwesomeIcon icon={faCheck} /></button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <article className={`${styles.noticeCard} ${styles.creatorCard}`} onClick={() => setIsCreating(true)}>
                            <span className={styles.creatorPlaceholder}>새로운 기록의 시작...</span>
                        </article>
                    )}
                </div>
                {sortedNotices.map((notice, index) => {
                    const prevDate = index > 0 ? new Date(sortedNotices[index - 1].timestamp).toLocaleDateString() : null;
                    const showDate = new Date(notice.timestamp).toLocaleDateString() !== prevDate;
                    return (
                        <NoticeItem
                            key={notice.id}
                            notice={notice}
                            isExpanded={expandedIds.has(notice.id)}
                            isEditing={editingId === notice.id}
                            onToggleExpand={() => toggleExpand(notice.id)}
                            onStartEdit={() => setEditingId(notice.id)}
                            onEndEdit={() => setEditingId(null)}
                            onPin={() => handlePinNotice(notice.id)}
                            onDelete={() => handleDeleteNotice(notice.id)}
                            onUpdate={(data) => handleUpdateNotice(notice.id, data)}
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