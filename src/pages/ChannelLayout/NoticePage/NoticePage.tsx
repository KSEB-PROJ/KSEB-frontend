import React, { useState, useMemo, useRef, useLayoutEffect, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import styles from './NoticePage.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPen, faTrash, faTimes, faCheck } from '@fortawesome/free-solid-svg-icons';
import DatePicker from '../../../components/date-picker/DatePicker';
import { useNoticeStore } from '../../../stores/noticeStore'; // 스토어 import
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
console.log("NoticePage mounted");
const Marker: React.FC<{ notice: Notice; isHovered: boolean }> = ({
    notice,
    isHovered,
}) => {
    // 현재 시각
    const now = new Date();

    // 공지 만료일 유무 (pinnedUntil 값으로 판단)
    const hasLifespan = !!notice.pinnedUntil;
    const isInfinite = notice.pinnedUntil === null;

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


/* NoticeItem: 공지 개별 항목 */
/**
 * @description
 * 개별 공지 카드 렌더링 (수정/삭제/더보기 등)
 * - 수정 모드/읽기 모드/확장 여부 관리
 */
const NoticeItem: React.FC<{
    notice: Notice;
    isExpanded: boolean;
    isEditing: boolean;
    isDeleting: boolean;
    onToggleExpand: () => void;
    onStartEdit: () => void;
    onEndEdit: () => void;
    onDeleteClick: () => void;
    onConfirmDelete: () => void;
    onCancelDelete: () => void;
    onUpdate: (data: NoticeUpdateRequest) => Promise<boolean>;
    showDate: boolean;
    isHovered: boolean;
    onMouseEnter: () => void;
}> = ({
    notice, isExpanded, isEditing, isDeleting, onToggleExpand, onStartEdit, onEndEdit,
    onDeleteClick, onConfirmDelete, onCancelDelete, onUpdate, showDate, isHovered, onMouseEnter,
}) => {
        const editableRef = useRef<HTMLDivElement>(null);
        const markdownRef = useRef<HTMLDivElement>(null);
        const [isOverflowing, setOverflow] = useState(false);
        const [editedExpiresAt, setEditedExpiresAt] = useState<string | null>(notice.pinnedUntil ?? null);

        useLayoutEffect(() => {
            const targetRef = markdownRef.current;
            if (targetRef && !isEditing) {
                setOverflow(targetRef.scrollHeight > targetRef.clientHeight);
            }
        }, [notice.content, isExpanded, isEditing]);

        // 수정 모드 진입 시에만 내용을 설정하여 불필요한 재렌더링과 데이터 중복 문제를 방지.
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
            } else {
                // 수정모드 빠져나올 때 꼭 비워줘야 함
                if (editableRef.current) {
                    editableRef.current.innerText = '';
                }
            }
            // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [isEditing]);

        const handleUpdate = async () => {
            const newContent = editableRef.current?.innerText.trim() ?? '';
            if (!newContent) {
                toast.error('공지 내용을 입력해주세요.');
                return;
            }
            const success = await onUpdate({ content: newContent, pinnedUntil: editedExpiresAt });
            if (success) {
                if (editableRef.current) editableRef.current.innerText = '';
                onEndEdit();
            }
        };


        const d = new Date(notice.createdAt);
        const dateStr = `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;

        return (
            <div className={`${styles.timelineEntry} ${notice.pinnedUntil !== undefined ? styles.pinned : ''}`} onMouseEnter={onMouseEnter}>
                <Marker notice={notice} isHovered={isHovered} />
                {showDate && <span className={styles.dateLabel}>{dateStr}</span>}
                <article className={styles.noticeCard}>
                    <div className={styles.cardHeader}>
                        <div className={styles.authorGroup}>
                            <span className={styles.author}>{notice.userName}</span>
                            {notice.originChannel && <span className={styles.originChannel}>{notice.originChannel}</span>}
                        </div>
                        <div className={styles.buttonGroup}>
                            {isDeleting ? (
                                <div className={styles.deleteConfirm}>
                                    <span className={styles.deleteConfirmText}>삭제?</span>
                                    <button onClick={onConfirmDelete} className={`${styles.iconButton} ${styles.confirmButton}`} title="확인"><FontAwesomeIcon icon={faCheck} /></button>
                                    <button onClick={onCancelDelete} className={`${styles.iconButton} ${styles.cancelButton}`} title="취소"><FontAwesomeIcon icon={faTimes} /></button>
                                </div>
                            ) : (
                                <>
                                    <button className={styles.iconButton} title="수정" onClick={onStartEdit}><FontAwesomeIcon icon={faPen} /></button>
                                    <button className={styles.iconButton} title="삭제" onClick={onDeleteClick}><FontAwesomeIcon icon={faTrash} /></button>
                                </>
                            )}
                        </div>
                    </div>
                    <div className={`${styles.contentWrapper} ${isEditing ? styles.editingWrapper : ''}`}>
                        {isEditing ? (
                            <div ref={editableRef} className={styles.content} contentEditable suppressContentEditableWarning data-placeholder="공지 내용을 입력하세요..." />
                        ) : (
                            <div ref={markdownRef} className={`${styles.content} ${isExpanded ? styles.expandedContent : ''}`}>
                                <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>{notice.content}</ReactMarkdown>
                            </div>
                        )}
                        {isEditing ? (
                            <div className={styles.editActions}>
                                <button className={`${styles.actionButton} ${styles.cancelButton}`} title="취소" onClick={onEndEdit}><FontAwesomeIcon icon={faTimes} /></button>
                                <DatePicker value={editedExpiresAt} onChange={setEditedExpiresAt} showTime />
                                <button className={`${styles.actionButton} ${styles.saveButton}`} title="저장" onClick={handleUpdate}><FontAwesomeIcon icon={faCheck} /></button>
                            </div>
                        ) : (
                            (isOverflowing || isExpanded) && <button className={styles.readMoreButton} onClick={onToggleExpand}>{isExpanded ? '간략히' : '더 보기'}</button>
                        )}
                    </div>
                </article>
            </div>
        );
    };


/* NoticePage: 공지 전체 목록/생성 페이지  */
const NoticePage: React.FC = () => {
    const { groupId, channelId } = useParams<{ groupId: string, channelId: string }>();

    // Zustand 스토어에서 상태와 액션을 가져옴
    const { notices, isLoading, fetchNotices, createNotice, updateNotice, deleteNotice } = useNoticeStore();

    // UI 상태는 컴포넌트 내부에 유지
    const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
    const [editingId, setEditingId] = useState<number | null>(null);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [hoveredId, setHoveredId] = useState<number | null>(null);
    const [isCreating, setCreating] = useState(false);
    const [newContent, setNewContent] = useState('');
    const [newExpiresAt, setNewExpiresAt] = useState<string | null>(null);

    // 그룹 ID가 변경되면 스토어의 fetchNotices 액션을 호출
    useEffect(() => {
        if (groupId) {
            fetchNotices(parseInt(groupId));
        }
    }, [groupId, fetchNotices]);

    // 스토어 액션을 호출하고 성공 시 UI 상태 초기화
    const handleCreateNotice = async () => {
        if (!groupId || !channelId) return;
        if (!newContent.trim()) {
            toast.error('공지 내용을 입력해주세요.');
            return;
        }

        const success = await createNotice(parseInt(groupId), {
            channelId: parseInt(channelId),
            content: newContent.trim(),
            pinnedUntil: newExpiresAt,
        });

        if (success) {
            setCreating(false);
            setNewContent('');
            setNewExpiresAt(null);
        }
    };

    // 스토어 액션 호출
    const handleUpdateNotice = async (noticeId: number, data: NoticeUpdateRequest) => {
        if (!groupId) return false;
        return await updateNotice(parseInt(groupId), noticeId, data);
    };

    // 스토어 액션 호출
    const handleConfirmDelete = async (noticeId: number) => {
        if (!groupId) return;
        const success = await deleteNotice(parseInt(groupId), noticeId);
        if (success) {
            setDeletingId(null); // 삭제 확인 UI 닫기
        }
    };

    const toggleExpand = (id: number) => {
        setExpandedIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) newSet.delete(id);
            else newSet.add(id);
            return newSet;
        });
    };

    const sortedNotices = useMemo(() => {
        console.log('notices changed:', notices.map(n => n.id));
        return [...notices].sort((a, b) => dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf());
    }, [notices]);

    if (isLoading) {
        return <div className={styles.container}>공지사항을 불러오는 중...</div>
    }

    return (
        <div className={styles.container}>
            <div className={styles.timeline}>
                <div className={`${styles.timelineEntry} ${styles.creatorEntry}`}>
                    <div className={styles.creatorMarker} onClick={() => !isCreating && setCreating(true)} />
                    {isCreating ? (
                        <div className={`${styles.noticeCard} ${styles.creatingCard}`}>
                            <div className={`${styles.contentWrapper} ${styles.editingWrapper}`}>
                                <div className={styles.content} contentEditable suppressContentEditableWarning data-placeholder="공지 내용을 입력하세요..." onInput={e => setNewContent(e.currentTarget.innerText)} autoFocus />
                                <div className={styles.editActions}>
                                    <button className={`${styles.actionButton} ${styles.cancelButton}`} title="취소" onClick={() => setCreating(false)}><FontAwesomeIcon icon={faTimes} /></button>
                                    <DatePicker value={newExpiresAt} onChange={setNewExpiresAt} showTime />
                                    <button className={`${styles.actionButton} ${styles.saveButton}`} title="저장" onClick={handleCreateNotice}><FontAwesomeIcon icon={faCheck} /></button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <article className={`${styles.noticeCard} ${styles.creatorCard}`} onClick={() => setCreating(true)}>
                            <span className={styles.creatorPlaceholder}>새로운 기록의 시작...</span>
                        </article>
                    )}
                </div>

                {sortedNotices.map((n, i) => {
                    console.log('render', n.id, typeof n.id);
                    const prevDate = i > 0 ? new Date(sortedNotices[i - 1].createdAt).toLocaleDateString() : null;
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
                            onUpdate={(data) => handleUpdateNotice(n.id, data)}
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