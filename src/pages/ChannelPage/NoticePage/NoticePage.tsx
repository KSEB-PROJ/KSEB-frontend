import React, { useState, useMemo, useRef, useLayoutEffect, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import styles from './NoticePage.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPen, faTrash, faTimes, faCheck } from '@fortawesome/free-solid-svg-icons';
import DatePicker from '../../../components/date-picker/DatePicker';
import { getNotices, createNotice, updateNotice, deleteNotice } from '../../../api/notice';
import type { Notice, NoticeUpdateRequest } from '../../../types';
import dayjs from 'dayjs';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';

/* Marker: 공지 왼쪽 타임라인 */
/**
 * @description
 * 공지의 "진행/만료 상태"를 시각적으로 보여주는 타임라인 마커 컴포넌트
 * - 남은 기간, 고정 여부(영구 공지) 등을 나타냄
 */
const Marker: React.FC<{ notice: Notice; isHovered: boolean }> = ({
    notice,
    isHovered,
}) => {
    // 현재 시각
    const now = new Date();

    // 공지 만료일 유무 (pinnedUntil 값으로 판단)
    const hasLifespan = !!notice.pinnedUntil;
    const isInfinite = notice.pinnedUntil === null; // pinnedUntil이 null이면 영구 고정으로 간주 (고정된 상태에서)

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
        const start = new Date(notice.createdAt).getTime();
        const end = new Date(notice.pinnedUntil!).getTime();
        const nowT = now.getTime();
        const total = end - start;
        if (total <= 0) return { statusClass: styles.danger, circumference: 2 * Math.PI * 8, strokeDashoffset: 0 };
        const remain = end - nowT;
        if (remain <= 0) return { statusClass: styles.danger, circumference: 2 * Math.PI * 8, strokeDashoffset: 0 };
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
            const end = new Date(notice.pinnedUntil!);
            const diff = end.getTime() - now.getTime();
            const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
            setTooltip({
                visible: true,
                text: days > 0 ? `D-${days}` : '만료됨',
                isDanger: progressProps?.statusClass === styles.danger,
                isInfo: false,
            });
        } else if (isInfinite && notice.pinnedUntil !== undefined) { // 고정 상태일때만
            setTooltip({
                visible: true,
                text: '영구 공지',
                isDanger: false,
                isInfo: true,
            });
        }
    };

    const isPinned = notice.pinnedUntil !== undefined;

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
                className={`${styles.markerBase} ${isHovered ? styles.hoverActive : ''} ${isPinned && isInfinite ? styles.infiniteMarker : ''
                    }`}
            />
            {/* 기간 있는 경우만 원형 진행률 */}
            {isPinned && progressProps && (
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

/* NoticeItem: 공지 개별 항목  */
/**
 * @description
 * 개별 공지 카드 렌더링 (수정/삭제/더보기 등)
 * - 수정 모드/읽기 모드/확장 여부 관리
 * - 협업 시 각 기능별 주석 참고!
 */
const NoticeItem: React.FC<{
    notice: Notice;
    isExpanded: boolean;
    isEditing: boolean;
    isDeleting: boolean; // [추가] 삭제 확인 상태
    onToggleExpand: () => void;
    onStartEdit: () => void;
    onEndEdit: () => void;
    onDeleteClick: () => void; // [수정] 삭제 버튼 클릭 핸들러
    onConfirmDelete: () => void; // [추가] 삭제 최종 확인 핸들러
    onCancelDelete: () => void; // [추가] 삭제 취소 핸들러
    onUpdate: (noticeId: number, data: NoticeUpdateRequest) => void;
    showDate: boolean;
    isHovered: boolean;
    onMouseEnter: () => void;
}> = ({
    notice, isExpanded, isEditing, isDeleting, onToggleExpand, onStartEdit, onEndEdit,
    onDeleteClick, onConfirmDelete, onCancelDelete, onUpdate, showDate, isHovered, onMouseEnter,
}) => {
    // 수정 가능한 content DOM ref
    const editableRef = useRef<HTMLDivElement>(null);
    const markdownRef = useRef<HTMLDivElement>(null);

    // 내용이 2줄 이상 넘어갈 경우 '더보기' 버튼 표시
    const [isOverflowing, setOverflow] = useState(false);

    // 만료일(달력) 상태
    const [editedExpiresAt, setEditedExpiresAt] = useState<string | null>(
        notice.pinnedUntil ?? null
    );

    // (1) 내용 오버플로우 체크 (읽기모드 & 확장X일 때)
    useLayoutEffect(() => {
        const targetRef = markdownRef.current;
        if (targetRef && !isEditing) {
            setOverflow(targetRef.scrollHeight > targetRef.clientHeight);
        }
    }, [notice.content, isExpanded, isEditing]);


    // (2) 편집 모드 진입 시, 만료일/커서 초기화
    useEffect(() => {
        if (isEditing) {
            if (editableRef.current) {
                editableRef.current.innerText = notice.content;
                editableRef.current.focus();
                const range = document.createRange();
                const sel = window.getSelection();
                range.selectNodeContents(editableRef.current);
                range.collapse(false);
                sel?.removeAllRanges();
                sel?.addRange(range);
            }
            setEditedExpiresAt(notice.pinnedUntil ?? null);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isEditing]);

    // (3) 저장 버튼 클릭 시, 수정한 내용 및 만료일 반영
    const handleUpdate = () => {
        const newContent = editableRef.current?.innerText.trim() ?? '';
        if (!newContent) {
            toast.error('공지 내용을 입력해주세요.');
            return;
        }
        onUpdate(notice.id, { content: newContent, pinnedUntil: editedExpiresAt });
        onEndEdit();
    };

    // 작성일 yyyy.MM.dd 형태
    const d = new Date(notice.createdAt);
    const dateStr = `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;

    return (
        <div
            className={`${styles.timelineEntry} ${notice.pinnedUntil !== undefined ? styles.pinned : ''}`}
            onMouseEnter={onMouseEnter}
        >
            <Marker notice={notice} isHovered={isHovered} />
            {showDate && <span className={styles.dateLabel}>{dateStr}</span>}
            <article className={styles.noticeCard}>
                {/* 상단 버튼(수정/삭제) */}
                <div className={styles.cardHeader}>
                    <div className={styles.authorGroup}>
                        <span className={styles.author}>{notice.userName}</span>
                        {notice.originChannel && <span className={styles.originChannel}>{notice.originChannel}</span>}
                    </div>
                    <div className={styles.buttonGroup}>
                        {isDeleting ? (
                            <div className={styles.deleteConfirm}>
                                <span className={styles.deleteConfirmText}>삭제?</span>
                                <button onClick={onConfirmDelete} className={`${styles.iconButton} ${styles.confirmButton}`} title="확인">
                                    <FontAwesomeIcon icon={faCheck} />
                                </button>
                                <button onClick={onCancelDelete} className={`${styles.iconButton} ${styles.cancelButton}`} title="취소">
                                    <FontAwesomeIcon icon={faTimes} />
                                </button>
                            </div>
                        ) : (
                            <>
                                <button className={styles.iconButton} title="수정" onClick={onStartEdit}>
                                    <FontAwesomeIcon icon={faPen} />
                                </button>
                                <button className={styles.iconButton} title="삭제" onClick={onDeleteClick}>
                                    <FontAwesomeIcon icon={faTrash} />
                                </button>
                            </>
                        )}
                    </div>
                </div>
                {/* 내용 영역 */}
                <div
                    className={`${styles.contentWrapper} ${isEditing ? styles.editingWrapper : ''
                        }`}
                >
                    {isEditing ? (
                        <div
                            ref={editableRef}
                            className={styles.content}
                            contentEditable={true}
                            suppressContentEditableWarning
                            data-placeholder="공지 내용을 입력하세요..."
                        />
                    ) : (
                        <div
                            ref={markdownRef}
                            className={`${styles.content} ${isExpanded ? styles.expandedContent : ''}`}
                        >
                            <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>{notice.content}</ReactMarkdown>
                        </div>
                    )}
                    {/* (수정모드) 편집액션: 취소/만료일설정/저장 */}
                    {isEditing ? (
                        <div className={styles.editActions}>
                            {/* 취소 */}
                            <button className={`${styles.actionButton} ${styles.cancelButton}`} title="취소" onClick={onEndEdit}><FontAwesomeIcon icon={faTimes} /></button>
                            {/* 만료일 DatePicker(달력) */}
                            <DatePicker value={editedExpiresAt} onChange={setEditedExpiresAt} showTime />
                            {/* 저장 */}
                            <button className={`${styles.actionButton} ${styles.saveButton}`} title="저장" onClick={handleUpdate}><FontAwesomeIcon icon={faCheck} /></button>
                        </div>
                    ) : (
                        // 읽기모드 && 오버플로우(2줄 초과)면 '더보기/간략히'
                        (isOverflowing || isExpanded) && <button className={styles.readMoreButton} onClick={onToggleExpand}>{isExpanded ? '간략히' : '더 보기'}</button>
                    )}
                </div>
            </article>
        </div>
    );
};

/* NoticePage: 공지 전체 목록/생성 페이지  */
/**
 * @description
 * 전체 공지 관리 및 렌더링 페이지
 * - 상태/정렬/생성/삭제 등
 * - useState, useMemo 등 React 기본 패턴 설명 포함
 */
const NoticePage: React.FC = () => {
    const { groupId, channelId } = useParams<{ groupId: string, channelId: string }>();
    // 공지 데이터 (공지 배열)
    const [notices, setNotices] = useState<Notice[]>([]);

    // 확장(더보기)된 공지 id Set
    const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

    // 편집중인 공지 id (하나만 가능)
    const [editingId, setEditingId] = useState<number | null>(null);

    // [추가] 삭제 확인할 공지 ID 상태
    const [deletingId, setDeletingId] = useState<number | null>(null);

    // 마우스 올린(hover) 공지 id
    const [hoveredId, setHoveredId] = useState<number | null>(null);

    // 새 공지 생성(작성) 상태
    const [isCreating, setCreating] = useState(false);
    const [newContent, setNewContent] = useState('');
    const [newExpiresAt, setNewExpiresAt] = useState<string | null>(null);

    // API 로딩 상태
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!groupId) return;

        const fetchNotices = async () => {
            setIsLoading(true);
            try {
                const response = await getNotices(parseInt(groupId));
                setNotices(response.data);
            } catch (error) {
                toast.error("공지 목록을 불러오는 데 실패했습니다.");
                console.error(error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchNotices();
    }, [groupId]);

    /**
     * [수정] 삭제 최종 확인 핸들러
     */
    const handleConfirmDelete = (id: number) => {
        if (!groupId) return;
        setDeletingId(null); // 확인 UI 닫기

        const promise = deleteNotice(parseInt(groupId), id);
        toast.promise(promise, {
            loading: '삭제 중...',
            success: () => {
                // 성공 시 1초 후 새로고침
                setTimeout(() => window.location.reload(), 1000);
                return <b>삭제되었습니다. 잠시 후 새로고침됩니다.</b>;
            },
            error: <b>삭제에 실패했습니다.</b>,
        });
    };

    /**
     * 공지 내용/만료일 수정 핸들러
     */
    const handleUpdate = (id: number, data: NoticeUpdateRequest) => {
        if (!groupId) return;
        const promise = updateNotice(parseInt(groupId), id, data);
        toast.promise(promise, {
            loading: '수정 중...',
            success: () => {
                // 성공 시 1초 후 새로고침
                setTimeout(() => window.location.reload(), 1000);
                return <b>수정되었습니다. 잠시 후 새로고침됩니다.</b>;
            },
            error: <b>수정에 실패했습니다.</b>,
        });
    };

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
    const handleCreateNotice = () => {
        if (!groupId || !channelId) return;

        if (!newContent.trim()) {
            toast.error('공지 내용을 입력해주세요.');
            return;
        }

        const promise = createNotice(parseInt(groupId), {
            channelId: parseInt(channelId),
            content: newContent.trim(),
            pinnedUntil: newExpiresAt,
        });

        toast.promise(promise, {
            loading: '공지 생성 중...',
            success: () => {
                // 성공 시 1초 후 새로고침
                setTimeout(() => window.location.reload(), 1000);
                return <b>공지가 등록되었습니다. 잠시 후 새로고침됩니다.</b>;
            },
            error: <b>공지 등록에 실패했습니다.</b>,
        });
    };

    /**
     * 공지 리스트 정렬 (최신순)
     */
    const sorted = useMemo(() => {
        return [...notices].sort((a, b) => {
            return dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf();
        });
    }, [notices]);

    if (isLoading) {
        return <div className={styles.container}>공지사항을 불러오는 중...</div>
    }

    /* [화면 렌더링]  */
    return (
        <div className={styles.container}>
            <div className={styles.timeline}>
                {/* 새 공지 생성 카드  */}
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
                                    <DatePicker value={newExpiresAt} onChange={setNewExpiresAt} showTime />
                                    {/* 저장 버튼 */}
                                    <button
                                        className={`${styles.actionButton} ${styles.saveButton}`}
                                        title="저장"
                                        onClick={handleCreateNotice}
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

                {/* 공지 리스트 전체 출력  */}
                {sorted.map((n, i) => {
                    // 이전 공지 날짜와 비교, 날짜 라벨 출력 여부 결정
                    const prevDate = i > 0 ? new Date(sorted[i - 1].createdAt).toLocaleDateString() : null;
                    const showDate = new Date(n.createdAt).toLocaleDateString() !== prevDate;
                    return (
                        <NoticeItem
                            key={n.id}
                            notice={n}
                            isExpanded={expandedIds.has(n.id)}
                            isEditing={editingId === n.id}
                            isDeleting={deletingId === n.id}
                            onToggleExpand={() => toggleExpand(n.id)}
                            onStartEdit={() => setEditingId(n.id)}
                            onEndEdit={() => setEditingId(null)}
                            onDeleteClick={() => setDeletingId(n.id)}
                            onConfirmDelete={() => handleConfirmDelete(n.id)}
                            onCancelDelete={() => setDeletingId(null)}
                            onUpdate={handleUpdate}
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