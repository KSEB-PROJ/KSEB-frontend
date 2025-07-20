import React, { useState, useMemo, useRef, useLayoutEffect, useEffect } from 'react';
import styles from './NoticePage.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faThumbtack, faPen, faTrash, faTimes, faCheck } from '@fortawesome/free-solid-svg-icons';
import DatePicker from '../../../components/date-picker/DatePicker';


/* --------------------- [1] 타입 & 샘플 데이터 정의 --------------------- */
/**
 * @typedef Notice
 * @property id          고유 id (number)
 * @property author      작성자 (string)
 * @property content     공지 내용 (string)
 * @property timestamp   작성 시각 (ISO 8601 string)
 * @property isPinned    고정 여부 (선택)
 * @property expiresAt   만료 일시 (선택)
 * @property originChannel  원 채널명(선택)
 */
// 임시 데이터라 실제 db 변수, 값이랑 다름
interface Notice {
    id: number;
    author: string;
    content: string;
    timestamp: string;
    isPinned?: boolean;
    expiresAt?: string | null;
    originChannel?: string;
}

// 샘플 데이터
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

/* --------------------- [2] Marker: 공지 왼쪽 타임라인 동그라미 --------------------- */
/**
 * @description
 *  공지의 "진행/만료 상태"를 시각적으로 보여주는 타임라인 마커 컴포넌트
 *  - 남은 기간, 고정 여부(영구 공지) 등을 나타냄
 */
const Marker: React.FC<{ notice: Notice; isHovered: boolean }> = ({
    notice,
    isHovered,
}) => {
    // 현재 시각
    const now = new Date();

    // 공지 만료일 유무
    const hasLifespan = !!notice.expiresAt;
    const isInfinite = !notice.expiresAt;

    // 마우스 올렸을 때 툴팁 상태
    const [tooltip, setTooltip] = useState({
        visible: false,
        text: '',
        isDanger: false,
        isInfo: false,
    });

    /**
     * 진행률(원형 progress) 표시 계산 함수
     * - 남은 시간/전체 기간 비율로 색상, 원 길이 계산
     */
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

    /**
     * 마우스 hover 시 툴팁 활성화 핸들러
     */
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
            setTooltip({
                visible: true,
                text: '영구 공지',
                isDanger: false,
                isInfo: true,
            });
        }
    };

    return (
        <div
            className={styles.markerContainer}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={() =>
                setTooltip({
                    visible: false,
                    text: '',
                    isDanger: false,
                    isInfo: false,
                })
            }
        >
            {/* 원형 베이스 */}
            <div
                className={`${styles.markerBase} ${isHovered ? styles.hoverActive : ''} ${isInfinite ? styles.infiniteMarker : ''
                    }`}
            />
            {/* 기간 있는 경우만 원형 진행률 */}
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
            {/* 마우스 올렸을 때 툴팁 */}
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

/* --------------------- [3] NoticeItem: 공지 개별 항목 --------------------- */
/**
 * @description
 *  개별 공지 카드 렌더링 (수정/삭제/핀 고정/더보기 등)
 *  - 수정 모드/읽기 모드/확장 여부 관리
 *  - 협업 시 각 기능별 주석 참고!
 */
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
    // 수정 가능한 content DOM ref
    const editableRef = useRef<HTMLDivElement>(null);

    // 내용이 2줄 이상 넘어갈 경우 '더보기' 버튼 표시
    const [isOverflowing, setOverflow] = useState(false);

    // 만료일(달력) 상태
    const [editedExpiresAt, setEditedExpiresAt] = useState<string | null>(
        notice.expiresAt ?? null
    );

    // (1) 내용 오버플로우 체크 (읽기모드 & 확장X일 때)
    useLayoutEffect(() => {
        if (editableRef.current && !isEditing) {
            setOverflow(
                editableRef.current.scrollHeight > editableRef.current.clientHeight
            );
        }
    }, [notice.content, isExpanded, isEditing]);

    // (2) 편집 모드 진입 시, 만료일/커서 초기화
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

    // (3) 저장 버튼 클릭 시, 수정한 내용 및 만료일 반영
    const handleUpdate = () => {
        const newContent = editableRef.current?.innerText ?? '';
        onUpdate({ content: newContent, expiresAt: editedExpiresAt });
        onEndEdit();
    };

    // 작성일 yyyy.MM.dd 형태로 가공
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
                {/* 상단 버튼(수정/삭제/고정) */}
                <div className={styles.cardHeader}>
                    <div className={styles.authorGroup}>
                        <span className={styles.author}>{notice.author}</span>
                        {notice.originChannel && (
                            <span className={styles.originChannel}>{notice.originChannel}</span>
                        )}
                    </div>
                    <div className={styles.buttonGroup}>
                        {/* 수정 버튼 */}
                        <button
                            className={styles.iconButton}
                            title="수정"
                            onClick={onStartEdit}
                        >
                            <FontAwesomeIcon icon={faPen} />
                        </button>
                        {/* 삭제 버튼 */}
                        <button
                            className={styles.iconButton}
                            title="삭제"
                            onClick={onDelete}
                        >
                            <FontAwesomeIcon icon={faTrash} />
                        </button>
                        {/* 핀 고정/해제 버튼 */}
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
                    {/* 공지 본문 (수정/읽기 모드 모두 지원) */}
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

                    {/* (수정모드) 편집액션: 취소/만료일설정/저장 */}
                    {isEditing ? (
                        <div className={styles.editActions}>
                            {/* 취소 */}
                            <button
                                className={`${styles.actionButton} ${styles.cancelButton}`}
                                title="취소"
                                onClick={onEndEdit}
                            >
                                <FontAwesomeIcon icon={faTimes} />
                            </button>
                            {/* 만료일 DatePicker(달력) */}
                            <DatePicker value={editedExpiresAt} onChange={setEditedExpiresAt} />
                            {/* 저장 */}
                            <button
                                className={`${styles.actionButton} ${styles.saveButton}`}
                                title="저장"
                                onClick={handleUpdate}
                            >
                                <FontAwesomeIcon icon={faCheck} />
                            </button>
                        </div>
                    ) : (
                        // 읽기모드 && 오버플로우(2줄 초과)면 '더보기/간략히'
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

/* --------------------- [4] NoticePage: 공지 전체 목록/생성 페이지 --------------------- */
/**
 * @description
 *  전체 공지 관리 및 렌더링 페이지
 *  - 상태/정렬/생성/삭제/고정 등
 *  - useState, useMemo 등 React 기본 패턴 설명 포함
 */
const NoticePage: React.FC = () => {
    // 공지 데이터 (공지 배열)
    const [notices, setNotices] = useState<Notice[]>(initialNotices);

    // 확장(더보기)된 공지 id Set
    const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

    // 편집중인 공지 id (하나만 가능)
    const [editingId, setEditingId] = useState<number | null>(null);

    // 마우스 올린(hover) 공지 id
    const [hoveredId, setHoveredId] = useState<number | null>(null);

    // 새 공지 생성(작성) 상태
    const [isCreating, setCreating] = useState(false);
    const [newContent, setNewContent] = useState('');
    const [newExpiresAt, setNewExpiresAt] = useState<string | null>(null);

    /**
     * 핀(고정) 토글 핸들러
     */
    const handlePin = (id: number) =>
        setNotices(ns => ns.map(n => n.id === id ? { ...n, isPinned: !n.isPinned } : n));

    /**
     * 삭제 핸들러
     */
    const handleDelete = (id: number) => {
        if (window.confirm('정말 이 공지를 삭제하시겠습니까?')) {
            setNotices(ns => ns.filter(n => n.id !== id));
        }
    };

    /**
     * 공지 내용/만료일 수정 핸들러
     */
    const handleUpdate = (id: number, d: Partial<Notice>) =>
        setNotices(ns => ns.map(n => n.id === id ? { ...n, ...d } : n));

    /**
     * 더보기(확장) 토글 핸들러
     */
    const toggleExpand = (id: number) =>
        setExpandedIds(prev => {
            // Set(불변성 지키기)
            const s = new Set(prev);
            if (s.has(id)) {
                s.delete(id);
            } else {
                s.add(id);
            }
            return s;
        });

    /**
     * 새 공지 생성(저장) 핸들러
     */
    const createNotice = () => {
        if (!newContent.trim()) {
            alert('공지 내용을 입력해주세요.');
            return;
        }
        const n: Notice = {
            id: Date.now(),
            author: 'CurrentUser', // 실제 앱에서는 로그인 정보로 대체!
            content: newContent,
            timestamp: new Date().toISOString(),
            expiresAt: newExpiresAt,
        };
        setNotices(ns => [n, ...ns]);
        setCreating(false);
        setNewContent('');
        setNewExpiresAt(null);
    };

    /**
     * 공지 리스트 정렬
     * - 고정공지(pinned)가 항상 위로, 그다음 최신순
     */
    const sorted = useMemo(() => {
        return [...notices].sort((a, b) => {
            if (a.isPinned && !b.isPinned) return -1;
            if (!a.isPinned && b.isPinned) return 1;
            return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
        });
    }, [notices]);

    /* --------------------- [화면 렌더링] --------------------- */
    return (
        <div className={styles.container}>
            <div className={styles.timeline}>
                {/* ── 새 공지 생성 카드 ── */}
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
                                    {/* 취소 버튼 */}
                                    <button
                                        className={`${styles.actionButton} ${styles.cancelButton}`}
                                        title="취소"
                                        onClick={() => setCreating(false)}
                                    >
                                        <FontAwesomeIcon icon={faTimes} />
                                    </button>
                                    {/* 만료일 달력 */}
                                    <DatePicker value={newExpiresAt} onChange={setNewExpiresAt} />
                                    {/* 저장 버튼 */}
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

                {/* ── 공지 리스트 전체 출력 ── */}
                {sorted.map((n, i) => {
                    // 이전 공지 날짜와 비교, 날짜 라벨 출력 여부 결정
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