import React, {useState, useMemo, useRef, useLayoutEffect, useEffect,} from 'react';
import styles from './NoticePage.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {faThumbtack,faPen,faTrash,faTimes,faCheck  } from '@fortawesome/free-solid-svg-icons';

import DatePicker from '../../../components/date-picker/DatePicker';

/* ───────── 데이터 타입 & 샘플 ───────── */
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
    {
        id: 1,
        author: '관리자',
        content: '[필독] 캡스톤 디자인 최종 발표 관련 중요 안내입니다...',
        timestamp: '2025-07-10T10:00:00',
        isPinned: true,
        expiresAt: '2025-08-10T23:59:59',
    },
    {
        id: 2,
        author: '박서연',
        content: '다음 주 월요일(28일) 팀 회의는 오후 3시로 변경...',
        timestamp: '2025-07-11T11:00:00',
        isPinned: true,
        expiresAt: null,
        originChannel: '#일반',
    },
    {
        id: 3,
        author: '김세현',
        content: '교수님께서 주신 피드백을 정리해서 올립니다...',
        timestamp: '2025-07-01T14:30:00',
        expiresAt: '2025-07-30T23:59:59',
        originChannel: '#회의록',
    },
];

/* ───────── Marker 컴포넌트 ───────── */
const Marker: React.FC<{ notice: Notice; isHovered: boolean }> = ({
    notice,
    isHovered,
}) => {
    const now = new Date();
    const hasLifespan = !!notice.expiresAt;
    const isInfinite = !notice.expiresAt;
    const [tooltip, setTooltip] = useState({
        visible: false,
        text: '',
        isDanger: false,
        isInfo: false,
    });

    const getProgressProps = () => {
        if (!hasLifespan) return null;
        const start = new Date(notice.timestamp).getTime();
        const end = new Date(notice.expiresAt!).getTime();
        const nowT = now.getTime();
        const total = end - start;
        if (total <= 0) return null;
        const remain = end - nowT;
        if (remain <= 0) return null;
        const progress = remain / total;
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
            const diff = end.getTime() - now.getTime();
            const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
            setTooltip({
                visible: true,
                text: `D-${days}`,
                isDanger: progressProps?.statusClass === styles.danger,
                isInfo: false,
            });
        } else if (isInfinite) {
            setTooltip({ visible: true, text: '영구 공지', isDanger: false, isInfo: true });
        }
    };

    return (
        <div
            className={styles.markerContainer}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={() =>
                setTooltip({ visible: false, text: '', isDanger: false, isInfo: false })
            }
        >
            <div
                className={`${styles.markerBase} ${isHovered ? styles.hoverActive : ''} ${isInfinite ? styles.infiniteMarker : ''
                    }`}
            />
            {progressProps && (
                <svg className={styles.markerSvg} viewBox="0 0 22 22">
                    <circle
                        className={`${styles.markerProgress} ${progressProps.statusClass}`}
                        cx="11"
                        cy="11"
                        r="8"
                        strokeDasharray={progressProps.circumference}
                        strokeDashoffset={progressProps.strokeDashoffset}
                    />
                </svg>
            )}
            {tooltip.visible && (
                <div
                    className={`${styles.tooltip} ${tooltip.isDanger ? styles.tooltipDanger : ''
                        } ${tooltip.isInfo ? styles.tooltipInfo : ''}`}
                >
                    {tooltip.text}
                </div>
            )}
        </div>
    );
};

/* ───────── NoticeItem ───────── */
const NoticeItem: React.FC<{
    notice: Notice;
    isExpanded: boolean;
    isEditing: boolean;
    onToggleExpand: () => void;
    onStartEdit: () => void;
    onEndEdit: () => void;
    onPin: () => void;
    onDelete: () => void;
    onUpdate: (d: Partial<Notice>) => void;
    showDate: boolean;
    isHovered: boolean;
    onMouseEnter: () => void;
}> = ({
    notice,
    isExpanded,
    isEditing,
    onToggleExpand,
    onStartEdit,
    onEndEdit,
    onPin,
    onDelete,
    onUpdate,
    showDate,
    isHovered,
    onMouseEnter,
}) => {
        const editableRef = useRef<HTMLDivElement>(null);
        const [isOverflowing, setOverflow] = useState(false);
        const [editedExpiresAt, setEditedExpiresAt] = useState<string | null>(
            notice.expiresAt ?? null
        );

        /* 내용 줄수 계산 */
        useLayoutEffect(() => {
            if (editableRef.current && !isEditing) {
                setOverflow(
                    editableRef.current.scrollHeight > editableRef.current.clientHeight
                );
            }
        }, [notice.content, isExpanded, isEditing]);

        /* 편집 모드 초기 포커스 */
        useEffect(() => {
            if (isEditing && editableRef.current) {
                setEditedExpiresAt(notice.expiresAt ?? null);
                editableRef.current.focus();
                const range = document.createRange();
                const sel = window.getSelection();
                range.selectNodeContents(editableRef.current);
                range.collapse(false);
                sel?.removeAllRanges();
                sel?.addRange(range);
            }
        }, [isEditing, notice.expiresAt]);

        const handleUpdate = () => {
            const newContent = editableRef.current?.innerText ?? '';
            onUpdate({ content: newContent, expiresAt: editedExpiresAt });
            onEndEdit();
        };

        const d = new Date(notice.timestamp);
        const dateStr = `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;

        return (
            <div
                className={`${styles.timelineEntry} ${notice.isPinned ? styles.pinned : ''}`}
                onMouseEnter={onMouseEnter}
            >
                <Marker notice={notice} isHovered={isHovered} />
                {showDate && <span className={styles.dateLabel}>{dateStr}</span>}

                <article className={styles.noticeCard}>
                    {/* 헤더 버튼 */}
                    <div className={styles.cardHeader}>
                        <div className={styles.authorGroup}>
                            <span className={styles.author}>{notice.author}</span>
                            {notice.originChannel && (
                                <span className={styles.originChannel}>{notice.originChannel}</span>
                            )}
                        </div>
                        <div className={styles.buttonGroup}>
                            <button
                                className={styles.iconButton}
                                title="수정"
                                onClick={onStartEdit}
                            >
                                <FontAwesomeIcon icon={faPen} />
                            </button>
                            <button
                                className={styles.iconButton}
                                title="삭제"
                                onClick={onDelete}
                            >
                                <FontAwesomeIcon icon={faTrash} />
                            </button>
                            <button
                                className={`${styles.iconButton} ${styles.pinButton}`}
                                title={notice.isPinned ? '고정 해제' : '고정하기'}
                                onClick={onPin}
                            >
                                <FontAwesomeIcon icon={faThumbtack} />
                            </button>
                        </div>
                    </div>

                    {/* 내용 영역 */}
                    <div
                        className={`${styles.contentWrapper} ${isEditing ? styles.editingWrapper : ''
                            }`}
                    >
                        <div
                            ref={editableRef}
                            className={`${styles.content} ${isExpanded && !isEditing ? styles.expandedContent : ''
                                }`}
                            contentEditable={isEditing}
                            suppressContentEditableWarning
                            data-placeholder="공지 내용을 입력하세요..."
                        >
                            {notice.content}
                        </div>

                        {/* 편집 / 보기 모드 전환 버튼 */}
                        {isEditing ? (
                            <div className={styles.editActions}>
                                <button
                                    className={`${styles.actionButton} ${styles.cancelButton}`}
                                    title="취소"
                                    onClick={onEndEdit}
                                >
                                    <FontAwesomeIcon icon={faTimes} />
                                </button>
                                <DatePicker value={editedExpiresAt} onChange={setEditedExpiresAt} />
                                <button
                                    className={`${styles.actionButton} ${styles.saveButton}`}
                                    title="저장"
                                    onClick={handleUpdate}
                                >
                                    <FontAwesomeIcon icon={faCheck} />
                                </button>
                            </div>
                        ) : (
                            (isOverflowing || isExpanded) && (
                                <button
                                    className={styles.readMoreButton}
                                    onClick={onToggleExpand}
                                >
                                    {isExpanded ? '간략히' : '더 보기'}
                                </button>
                            )
                        )}
                    </div>
                </article>
            </div>
        );
    };

/* ───────── NoticePage ───────── */
const NoticePage: React.FC = () => {
    const [notices, setNotices] = useState<Notice[]>(initialNotices);
    const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
    const [editingId, setEditingId] = useState<number | null>(null);
    const [hoveredId, setHoveredId] = useState<number | null>(null);
    const [isCreating, setCreating] = useState(false);
    const [newContent, setNewContent] = useState('');
    const [newExpiresAt, setNewExpiresAt] = useState<string | null>(null);

    /* 핀, 삭제, 업데이트 핸들러 */
    const handlePin = (id: number) => setNotices(ns => ns.map(n => n.id === id ? { ...n, isPinned: !n.isPinned } : n));
    const handleDelete = (id: number) => {
        if (window.confirm('정말 이 공지를 삭제하시겠습니까?')) {
            setNotices(ns => ns.filter(n => n.id !== id));
        }
    };
    const handleUpdate = (id: number, d: Partial<Notice>) =>
        setNotices(ns => ns.map(n => n.id === id ? { ...n, ...d } : n));

    const toggleExpand = (id: number) =>
        setExpandedIds(prev => {
            const s = new Set(prev);
            s.has(id) ? s.delete(id) : s.add(id);
            return s;
        });

    /* 공지 생성 */
    const createNotice = () => {
        if (!newContent.trim()) {
            alert('공지 내용을 입력해주세요.');
            return;
        }
        const n: Notice = {
            id: Date.now(),
            author: 'CurrentUser',
            content: newContent,
            timestamp: new Date().toISOString(),
            expiresAt: newExpiresAt,
        };
        setNotices(ns => [n, ...ns]);
        setCreating(false);
        setNewContent('');
        setNewExpiresAt(null);
    };

    /* 정렬(핀→최신순) */
    const sorted = useMemo(() => {
        return [...notices].sort((a, b) => {
            if (a.isPinned && !b.isPinned) return -1;
            if (!a.isPinned && b.isPinned) return 1;
            return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
        });
    }, [notices]);

    return (
        <div className={styles.container}>
            <div className={styles.timeline}>
                {/* ── 새 공지 생성용 입력 카드 ── */}
                <div className={`${styles.timelineEntry} ${styles.creatorEntry}`}>
                    <div
                        className={styles.creatorMarker}
                        onClick={() => !isCreating && setCreating(true)}
                    />
                    {isCreating ? (
                        <div className={`${styles.noticeCard} ${styles.creatingCard}`}>
                            <div className={`${styles.contentWrapper} ${styles.editingWrapper}`}>
                                <div
                                    className={styles.content}
                                    contentEditable
                                    suppressContentEditableWarning
                                    data-placeholder="공지 내용을 입력하세요..."
                                    onInput={e => setNewContent(e.currentTarget.innerText)}
                                    autoFocus
                                />
                                <div className={styles.editActions}>
                                    <button
                                        className={`${styles.actionButton} ${styles.cancelButton}`}
                                        title="취소"
                                        onClick={() => setCreating(false)}
                                    >
                                        <FontAwesomeIcon icon={faTimes} />
                                    </button>
                                    <DatePicker value={newExpiresAt} onChange={setNewExpiresAt} />
                                    <button
                                        className={`${styles.actionButton} ${styles.saveButton}`}
                                        title="저장"
                                        onClick={createNotice}
                                    >
                                        <FontAwesomeIcon icon={faCheck} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <article
                            className={`${styles.noticeCard} ${styles.creatorCard}`}
                            onClick={() => setCreating(true)}
                        >
                            <span className={styles.creatorPlaceholder}>새로운 기록의 시작...</span>
                        </article>
                    )}
                </div>

                {/* ── 공지 리스트 ── */}
                {sorted.map((n, i) => {
                    const prevDate = i > 0 ? new Date(sorted[i - 1].timestamp).toLocaleDateString() : null;
                    const showDate = new Date(n.timestamp).toLocaleDateString() !== prevDate;
                    return (
                        <NoticeItem
                            key={n.id}
                            notice={n}
                            isExpanded={expandedIds.has(n.id)}
                            isEditing={editingId === n.id}
                            onToggleExpand={() => toggleExpand(n.id)}
                            onStartEdit={() => setEditingId(n.id)}
                            onEndEdit={() => setEditingId(null)}
                            onPin={() => handlePin(n.id)}
                            onDelete={() => handleDelete(n.id)}
                            onUpdate={d => handleUpdate(n.id, d)}
                            showDate={showDate}
                            isHovered={hoveredId === n.id}
                            onMouseEnter={() => setHoveredId(n.id)}
                        />
                    );
                })}
            </div>
        </div>
    );
};

export default NoticePage;
