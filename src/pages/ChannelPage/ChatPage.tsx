import React, { useRef, useState, useEffect, Fragment, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import styles from './ChatPage.module.css';
import remarkBreaks from "remark-breaks";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faPencil, faTrashCan, faThumbTack, faPaperPlane, faXmark, faPaperclip, faFilePdf, faFileWord,
    faFileExcel, faFileImage, faFileVideo, faFileAlt, faDownload, faCheck
} from '@fortawesome/free-solid-svg-icons';
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getMessages, sendMessage, updateMessage, deleteMessage } from '../../api/chat';
import { promoteMessageToNotice } from '../../api/notice'; // 공지 등록 API import
import type { ChatMessageResponse } from '../../types';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';

// 백엔드 API의 기본 URL (vite 환경 변수에서 가져옴)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL.replace('/api', '');

/**
 * [커스텀 훅] Textarea 자동 높이 조절
 * @description textarea의 내용이 변경될 때마다 높이를 자동으로 조절해주는 훅
 * @param {React.RefObject<HTMLTextAreaElement | null>} ref - 높이를 조절할 textarea의 ref
 * @param {string} value - textarea의 현재 값
 */
const useAutoResize = (ref: React.RefObject<HTMLTextAreaElement | null>, value: string) => {
    useEffect(() => {
        // ref가 존재할 때만 실행
        if (ref.current) {
            // 높이를 'auto'로 초기화하여 실제 필요한 높이를 다시 계산
            ref.current.style.height = 'auto';
            const scrollHeight = ref.current.scrollHeight;
            // 계산된 스크롤 높이를 실제 높이로 설정
            ref.current.style.height = `${scrollHeight}px`;
        }
    }, [ref, value]); // ref나 value가 변경될 때마다 실행
};


// 미디어(이미지/비디오) 뷰어에 필요한 데이터 타입
interface ViewerContent {
    type: 'IMAGE' | 'VIDEO';
    src: string;
    fileName: string;
}

// 파일 유형에 따라 적절한 FontAwesome 아이콘을 반환하는 함수
const getFileIcon = (messageType: string, fileName: string) => {
    switch (messageType) {
        case 'IMAGE': return faFileImage;
        case 'VIDEO': return faFileVideo;
        case 'DOCUMENT':
        default: // 문서 타입이거나 알 수 없는 타입일 경우 파일 확장자로 다시 구분
            if (fileName.endsWith(".pdf")) return faFilePdf;
            if (fileName.match(/\.(doc|docx)$/)) return faFileWord;
            if (fileName.match(/\.(xls|xlsx)$/)) return faFileExcel;
            return faFileAlt; // 그 외 모든 문서는 일반 파일 아이콘
    }
};

// 첨부파일 UI를 렌더링하는 컴포넌트
const FileAttachment: React.FC<{ message: ChatMessageResponse, onMediaClick: (content: ViewerContent) => void }> = ({ message, onMediaClick }) => {
    // 파일 URL이나 이름이 없으면 아무것도 렌더링하지 않음
    if (!message.fileUrl || !message.fileName) return null;

    // API URL을 조합하여 실제 파일 접근 경로 생성
    const fullUrl = `${API_BASE_URL}${message.fileUrl}`;
    const fileIcon = getFileIcon(message.messageType, message.fileName);

    // 파일 다운로드 핸들러
    const handleDownload = async (e: React.MouseEvent) => {
        e.preventDefault(); // 기본 동작(링크 이동) 방지
        e.stopPropagation(); // 이벤트 버블링 방지
        toast.loading('다운로드 준비 중...');
        try {
            const response = await fetch(fullUrl);
            if (!response.ok) throw new Error('파일 다운로드 실패');
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = message.fileName!;
            document.body.appendChild(a);
            a.click(); // 가상 링크 클릭으로 다운로드 트리거
            a.remove();
            window.URL.revokeObjectURL(url); // 메모리 해제
            toast.dismiss();
            toast.success('다운로드가 시작되었습니다.');
        } catch (error) {
            toast.dismiss();
            toast.error('다운로드에 실패했습니다.');
            console.error(error);
        }
    };

    // 메시지 타입이 'IMAGE'일 경우 이미지 뷰어 UI 렌더링
    if (message.messageType === 'IMAGE') {
        return (
            <div className={styles.mediaContainer} onClick={() => onMediaClick({ type: 'IMAGE', src: fullUrl, fileName: message.fileName! })}>
                <img src={fullUrl} alt={message.fileName} className={styles.imagePreview} />
                <div className={styles.mediaOverlay}>
                    <span className={styles.viewAction}>크게 보기</span>
                </div>
            </div>
        );
    }

    // 메시지 타입이 'VIDEO'일 경우 비디오 뷰어 UI 렌더링
    if (message.messageType === 'VIDEO') {
        return (
            <div className={styles.mediaContainer} onClick={() => onMediaClick({ type: 'VIDEO', src: fullUrl, fileName: message.fileName! })}>
                <video preload="metadata" className={styles.videoPreview} title={message.fileName}>
                    <source src={`${fullUrl}#t=0.5`} />
                </video>
                <div className={styles.mediaOverlay}>
                    <span className={styles.viewAction}>재생하기</span>
                </div>
            </div>
        );
    }

    // 그 외 파일(문서 등)은 다운로드 UI 렌더링
    return (
        <a href={fullUrl} target="_blank" rel="noopener noreferrer" className={styles.fileAttachmentWrapper}>
            <FontAwesomeIcon icon={fileIcon} className={styles.fileAttachmentIcon} />
            <div className={styles.fileAttachmentInfo}>
                <span className={styles.fileAttachmentName}>{message.fileName}</span>
                <span className={styles.fileAttachmentMeta}>{message.messageType.toLowerCase()}</span>
            </div>
            <button onClick={handleDownload} className={styles.fileAttachmentDownloadBtn}>
                <FontAwesomeIcon icon={faDownload} />
            </button>
        </a>
    );
};

// 이미지/동영상을 전체 화면으로 보여주는 미디어 뷰어 컴포넌트
const MediaViewer: React.FC<{ content: ViewerContent | null, onClose: () => void }> = ({ content, onClose }) => {
    // 닫힘 애니메이션을 위한 상태
    const [isClosing, setIsClosing] = useState(false);

    // 닫기 핸들러 (애니메이션 포함)
    const handleClose = useCallback(() => {
        setIsClosing(true);
        setTimeout(onClose, 300); // 0.3초 애니메이션 후 실제로 닫힘
    }, [onClose]);

    // 미디어 다운로드 핸들러
    const handleDownload = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!content) return;
        // ... (FileAttachment의 다운로드 로직과 동일)
        toast.loading('다운로드 준비 중...');
        try {
            const response = await fetch(content.src);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = content.fileName;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
            toast.dismiss();
            toast.success('다운로드를 시작합니다.');
        } catch (error) {
            toast.dismiss();
            toast.error('다운로드에 실패했습니다.');
            console.error(error);
        }
    };

    // ESC 키로 뷰어 닫기
    useEffect(() => {
        if (content) setIsClosing(false);
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') handleClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [content, handleClose]);

    if (!content) return null;

    return (
        <div className={`${styles.mediaViewerOverlay} ${isClosing ? styles.closing : ''}`} onClick={handleClose}>
            <div className={styles.viewerHeader}>
                <span>{content.fileName}</span>
                <div className={styles.viewerActions}>
                    <button onClick={handleDownload} className={styles.viewerButton} title="다운로드">
                        <FontAwesomeIcon icon={faDownload} />
                    </button>
                    <button onClick={handleClose} className={styles.viewerButton} title="닫기 (ESC)">
                        <FontAwesomeIcon icon={faXmark} />
                    </button>
                </div>
            </div>
            <div className={styles.mediaViewerContent} onClick={(e) => e.stopPropagation()}>
                {content.type === 'IMAGE' && <img src={content.src} alt={content.fileName} className={styles.viewerImage} />}
                {content.type === 'VIDEO' && <video src={content.src} controls autoPlay className={styles.viewerVideo} />}
            </div>
        </div>
    );
};

// 메인 채팅 페이지 컴포넌트
const ChatPage: React.FC = () => {
    // URL 파라미터에서 채널 ID 가져오기
    const { groupId, channelId } = useParams<{ groupId: string, channelId: string }>();

    // DOM 요소 참조를 위한 ref
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const chatAreaRef = useRef<HTMLDivElement | null>(null);
    const chatInputRef = useRef<HTMLTextAreaElement>(null);
    const editInputRef = useRef<HTMLTextAreaElement>(null);

    // 컴포넌트 상태(State)
    const [messages, setMessages] = useState<ChatMessageResponse[]>([]); // 채팅 메시지 목록
    const [input, setInput] = useState(""); // 현재 입력 중인 메시지
    const [files, setFiles] = useState<File[]>([]); // 첨부 대기 중인 파일 목록
    const [isLoading, setIsLoading] = useState(true); // 메시지 로딩 상태
    const [editMessageId, setEditMessageId] = useState<number | null>(null); // 수정 중인 메시지 ID
    const [editValue, setEditValue] = useState(""); // 수정 중인 메시지의 내용
    const [deletingMessageId, setDeletingMessageId] = useState<number | null>(null); // 삭제 확인 중인 메시지 ID
    const [viewerContent, setViewerContent] = useState<ViewerContent | null>(null); // 미디어 뷰어에 표시할 콘텐츠

    // 자동 높이 조절 훅을 메인 입력창과 수정 입력창에 각각 적용
    useAutoResize(chatInputRef, input);
    useAutoResize(editInputRef, editValue);

    // 채널 ID가 변경될 때마다 메시지 목록을 불러오는 Effect
    useEffect(() => {
        if (!channelId) return;
        const fetchMessages = async () => {
            setIsLoading(true);
            try {
                const response = await getMessages(parseInt(channelId));
                setMessages(response.data);
            } catch (error) {
                console.error("메시지 로딩 실패:", error);
                toast.error("메시지를 불러오는데 실패했습니다.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchMessages();
    }, [channelId]);

    // 메시지 목록이 변경될 때마다 채팅 스크롤을 맨 아래로 이동
    useEffect(() => {
        if (chatAreaRef.current) chatAreaRef.current.scrollTop = chatAreaRef.current.scrollHeight;
    }, [messages]);

    // 수정 모드로 진입 시, 해당 textarea에 자동으로 포커스
    useEffect(() => {
        if (editMessageId !== null && editInputRef.current) {
            editInputRef.current.focus();
            const len = editInputRef.current.value.length;
            editInputRef.current.setSelectionRange(len, len);
        }
    }, [editMessageId]);

    // 외부 클릭 시 수정 모드 또는 삭제 확인 모드를 종료하는 Effect
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            // 수정 컨테이너 외부 클릭 시 수정 모드 종료
            if (editMessageId !== null && !target.closest(`.${styles.editContainer}`)) {
                setEditMessageId(null);
            }
            // 액션 버튼 외부 클릭 시 삭제 확인 모드 종료
            if (deletingMessageId !== null && !target.closest(`.${styles.messageActions}`)) {
                setDeletingMessageId(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [editMessageId, deletingMessageId]);

    // 메시지 전송 핸들러
    const handleSend = async () => {
        if (!channelId) return;
        const cleanInput = input.trim();
        // 내용과 파일이 모두 없으면 전송하지 않음
        if (cleanInput === "" && files.length === 0) return;

        const promise = sendMessage(parseInt(channelId), { content: cleanInput, files: files });

        toast.promise(promise, {
            loading: '전송 중...',
            success: (response) => {
                setMessages(prev => [...prev, ...response.data]);
                setInput(""); // 입력창 비우기
                setFiles([]); // 파일 목록 비우기
                if (chatInputRef.current) {
                    chatInputRef.current.style.height = 'auto'; // 전송 후 높이 초기화
                }
                return <b>전송 완료!</b>;
            },
            error: <b>전송에 실패했습니다.</b>
        });
    };

    // 메시지 수정 모드 시작 핸들러
    const handleEditStart = (msg: ChatMessageResponse) => {
        setDeletingMessageId(null); // 수정 시작 시 삭제 확인 UI는 닫음
        setEditMessageId(msg.id);
        setEditValue(msg.content || "");
    };

    // 메시지 수정 취소 핸들러
    const handleEditCancel = () => {
        setEditMessageId(null);
        setEditValue("");
    }

    // 메시지 수정 확정 핸들러
    const handleEditConfirm = async (messageId: number) => {
        if (!channelId || !editValue.trim()) return;

        const promise = updateMessage(parseInt(channelId), messageId, editValue.trim());

        toast.promise(promise, {
            loading: '수정 중...',
            success: (response) => {
                // messages 배열에서 해당 메시지만 업데이트
                setMessages(prev => prev.map(m => m.id === messageId ? response.data : m));
                handleEditCancel(); // 수정 UI 닫기
                return <b>수정 완료!</b>;
            },
            error: <b>수정에 실패했습니다.</b>
        });
    };
    
    // 메시지 공지 등록 핸들러
    const handlePromoteToNotice = (messageId: number) => {
        if(!groupId || !channelId) return;

        // confirm 창을 띄워 사용자에게 확인 받음
        if(window.confirm('이 메시지를 공지로 등록하시겠습니까?')) {
            const promise = promoteMessageToNotice(parseInt(groupId), parseInt(channelId), messageId, {});
            toast.promise(promise, {
                loading: '공지로 등록 중...',
                success: () => {
                    return <b>공지로 등록되었습니다.</b>;
                },
                error: (err) => {
                    console.error(err);
                    return <b>공지 등록에 실패했습니다.</b>
                }
            });
        }
    };


    // 메시지 삭제 핸들러 (실제 삭제 실행)
    const handleRemoveMsg = async (messageId: number) => {
        if (!channelId) return;
        setDeletingMessageId(null); // 삭제 확인 UI 닫기

        const promise = deleteMessage(parseInt(channelId), messageId);

        toast.promise(promise, {
            loading: '삭제 중...',
            success: () => {
                setMessages(prev => prev.filter(m => m.id !== messageId));
                return <b>삭제 완료!</b>;
            },
            error: <b>삭제에 실패했습니다.</b>
        });
    };

    // 입력창에서 Enter 키 입력 핸들러 (Shift+Enter는 줄바꿈)
    const handleInputKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    // 파일 첨부 핸들러
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = e.target.files;
        if (selectedFiles && selectedFiles.length > 0) {
            setFiles(prev => [...prev, ...Array.from(selectedFiles)]);
        }
    };

    // 첨부된 파일 제거 핸들러
    const handleRemoveFile = (fileToRemove: File) => {
        setFiles(prev => prev.filter(file => file !== fileToRemove));
    };

    if (isLoading) return <div className={styles.chatContainer}>로딩 중...</div>;

    let lastDate: string | null = null;

    return (
        <>
            <MediaViewer content={viewerContent} onClose={() => setViewerContent(null)} />
            <div className={styles.chatContainer}>
                <div className={styles.chatArea} ref={chatAreaRef}>
                    {messages.map((msg) => {
                        const currentDate = dayjs(msg.createdAt).format('YYYY년 MM월 DD일');
                        const showDateSeparator = currentDate !== lastDate;
                        lastDate = currentDate;

                        return (
                            <Fragment key={msg.id}>
                                {showDateSeparator && <div className={styles.dateSeparator}><span>{currentDate}</span></div>}
                                <div
                                    className={`${styles.messageRow} ${msg.isMine ? styles.myMessage : styles.otherMessage}`}
                                >
                                    {!msg.isMine && (
                                        <div className={styles.authorInfo}>
                                            <img src={"https://i.imgur.com/5cLDeXy.png"} className={styles.avatar} alt={msg.userName} />
                                        </div>
                                    )}
                                    <div className={styles.messageContent}>
                                        {/* 메시지 액션 버튼 (수정, 삭제 등) */}
                                        <div className={styles.messageActions}>
                                            {/* 삭제 확인 UI가 활성화된 경우 */}
                                            {deletingMessageId === msg.id ? (
                                                <div className={styles.deleteConfirmContainer}>
                                                    <button onClick={() => handleRemoveMsg(msg.id)} className={`${styles.editButton} ${styles.confirmButton}`} title="삭제 확인">
                                                        <FontAwesomeIcon icon={faCheck} />
                                                    </button>
                                                    <button onClick={() => setDeletingMessageId(null)} className={`${styles.editButton} ${styles.cancelConfirmButton}`} title="취소">
                                                        <FontAwesomeIcon icon={faXmark} />
                                                    </button>
                                                </div>
                                            ) : (
                                                /* 기본 액션 버튼 */
                                                <>
                                                    {/* [수정] 텍스트 메시지만 공지 등록 가능하도록 조건 추가 */}
                                                    {msg.messageType === 'TEXT' && (
                                                        <button title="공지로 등록" onClick={() => handlePromoteToNotice(msg.id)}>
                                                            <FontAwesomeIcon icon={faThumbTack} />
                                                        </button>
                                                    )}
                                                    {msg.isMine && !msg.fileUrl && (
                                                        <button title="수정" onClick={() => handleEditStart(msg)}>
                                                            <FontAwesomeIcon icon={faPencil} />
                                                        </button>
                                                    )}
                                                    {msg.isMine && (
                                                        <button title="삭제" onClick={() => setDeletingMessageId(msg.id)}>
                                                            <FontAwesomeIcon icon={faTrashCan} />
                                                        </button>
                                                    )}
                                                </>
                                            )}
                                        </div>

                                        {/* 수정 모드일 때와 아닐 때를 구분하여 렌더링 */}
                                        {editMessageId === msg.id ? (
                                            <div className={styles.editContainer}>
                                                <textarea
                                                    ref={editInputRef}
                                                    value={editValue}
                                                    onChange={e => setEditValue(e.target.value)}
                                                    onKeyDown={e => {
                                                        if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleEditConfirm(msg.id); }
                                                        if (e.key === "Escape") { handleEditCancel(); }
                                                    }}
                                                    className={styles.editInput}
                                                />
                                                <div className={styles.editActions}>
                                                    <button onClick={handleEditCancel} className={`${styles.editButton} ${styles.cancelButton}`} title="취소 (ESC)">
                                                        <FontAwesomeIcon icon={faXmark} />
                                                    </button>
                                                    <button onClick={() => handleEditConfirm(msg.id)} className={`${styles.editButton} ${styles.saveButton}`} title="저장 (Enter)">
                                                        <FontAwesomeIcon icon={faCheck} />
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className={styles.messageFragment}>
                                                {!msg.isMine && <div className={styles.authorName}>{msg.userName}</div>}
                                                {msg.content && <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>{msg.content}</ReactMarkdown>}
                                                <FileAttachment message={msg} onMediaClick={setViewerContent} />
                                            </div>
                                        )}
                                        <span className={styles.timestamp}>{dayjs(msg.createdAt).format('HH:mm')}</span>
                                    </div>
                                </div>
                            </Fragment>
                        );
                    })}
                </div>
                {/* 하단 메시지 입력 영역 */}
                <div className={styles.chatInputArea}>
                    {files.length > 0 && (
                        <div className={styles.filePreviewList}>
                            {files.map((file, index) => (
                                <span key={index} className={styles.filePreviewItem}>
                                    {file.name}
                                    <button className={styles.removeFileButton} onClick={() => handleRemoveFile(file)}><FontAwesomeIcon icon={faXmark} /></button>
                                </span>
                            ))}
                        </div>
                    )}
                    <div className={styles.inputRow}>
                        <button className={styles.sendButton} style={{ background: '#333' }} onClick={() => fileInputRef.current?.click()}><FontAwesomeIcon icon={faPaperclip} /></button>
                        <textarea
                            ref={chatInputRef}
                            value={input}
                            placeholder="메시지를 입력하세요..."
                            className={styles.chatInput}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={handleInputKeyDown}
                            rows={1}
                        />
                        <button className={styles.sendButton} onClick={handleSend} disabled={!input.trim() && files.length === 0}><FontAwesomeIcon icon={faPaperPlane} /></button>
                    </div>
                </div>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} multiple />
            </div>
        </>
    );
};

export default ChatPage;