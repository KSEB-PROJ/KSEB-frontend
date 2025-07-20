import React, { useRef, useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import styles from './ChatPage.module.css';
import remarkBreaks from "remark-breaks";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPencil, faTrashCan, faThumbTack, faPaperPlane, faXmark, faPaperclip, faFilePdf, faFileWord, faFileExcel, faFileImage, faFileVideo, faFileAudio, faFileAlt } from '@fortawesome/free-solid-svg-icons';
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getMessages, sendMessage, updateMessage, deleteMessage } from '../../api/chat';
import type { ChatMessageResponse } from '../../types';
import toast from 'react-hot-toast';

// 파일 미리보기 아이콘 관련 함수들 (기존과 동일)
const getFileIcon = (fileName: string, mimeType?: string) => {
    if (mimeType?.startsWith("image/")) return faFileImage;
    if (mimeType?.startsWith("video/")) return faFileVideo;
    if (mimeType?.startsWith("audio/")) return faFileAudio;
    if (fileName.endsWith(".pdf")) return faFilePdf;
    if (fileName.match(/\.(doc|docx)$/)) return faFileWord;
    if (fileName.match(/\.(xls|xlsx)$/)) return faFileExcel;
    return faFileAlt;
};
const getFileIconClass = (fileName: string, mimeType?: string) => {
    if (mimeType?.startsWith("image/")) return styles["fileIcon--image"];
    if (mimeType?.startsWith("video/")) return styles["fileIcon--video"];
    if (mimeType?.startsWith("audio/")) return styles["fileIcon--audio"];
    if (fileName.endsWith(".pdf")) return styles["fileIcon--pdf"];
    if (fileName.match(/\.(doc|docx)$/)) return styles["fileIcon--word"];
    if (fileName.match(/\.(xls|xlsx)$/)) return styles["fileIcon--excel"];
    return styles["fileIcon--etc"];
};

// 파일 미리보기 컴포넌트
export const FilePreviewItem: React.FC<{ fileUrl: string; fileName: string, mimeType?: string; }> = ({ fileUrl, fileName, mimeType }) => {
    const isImage = mimeType?.startsWith("image/");

    return (
        isImage ? (
            <img src={fileUrl} alt={fileName} className={styles.image} draggable={false} title={fileName} />
        ) : (
            <a href={fileUrl} target="_blank" rel="noopener noreferrer" className={styles.fileBox}>
                <FontAwesomeIcon icon={getFileIcon(fileName, mimeType)} size="lg" className={`${styles.fileIcon} ${getFileIconClass(fileName, mimeType)}`} />
                <span className={styles.fileName}>{fileName}</span>
            </a>
        )
    );
};


//메인 컴포넌트
const ChatPage: React.FC = () => {
    const { channelId } = useParams<{ channelId: string }>();
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const [file, setFile] = useState<File | null>(null); // 파일은 하나만 첨부
    const [input, setInput] = useState("");
    const chatAreaRef = useRef<HTMLDivElement | null>(null);
    const editInputRef = useRef<HTMLTextAreaElement | null>(null);
    const [editMessageId, setEditMessageId] = useState<number | null>(null);
    const [editValue, setEditValue] = useState("");
    const [messages, setMessages] = useState<ChatMessageResponse[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // 메시지 불러오기
    useEffect(() => {
        if (!channelId) return;

        const fetchMessages = async () => {
            setIsLoading(true);
            try {
                const response = await getMessages(parseInt(channelId));
                setMessages(response.data);
            } catch (error) {
                console.error("메시지 로딩 실패:", error); // 디버깅을 위해 콘솔에 에러 출력
                toast.error("메시지를 불러오는데 실패했습니다.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchMessages();
    }, [channelId]);

    // 스크롤 항상 아래로
    useEffect(() => {
        if (chatAreaRef.current) {
            chatAreaRef.current.scrollTop = chatAreaRef.current.scrollHeight;
        }
    }, [messages]);

    // 수정 모드 진입 시 포커스
    useEffect(() => {
        if (editInputRef.current) {
            editInputRef.current.focus();
            const len = editInputRef.current.value.length;
            editInputRef.current.setSelectionRange(len, len);
        }
    }, [editMessageId]);


    // 메시지 전송
    const handleSend = async () => {
        if (!channelId) return;
        const cleanInput = input.trim();
        if (cleanInput === "" && !file) return;

        const promise = sendMessage(parseInt(channelId), { content: cleanInput, file: file || undefined });

        toast.promise(promise, {
            loading: '전송 중...',
            success: (response) => {
                setMessages(prev => [...prev, response.data]);
                setInput("");
                setFile(null);
                return <b>전송 완료!</b>;
            },
            error: <b>전송에 실패했습니다.</b>
        });
    };

    // 메시지 수정 시작
    const handleEditStart = (msg: ChatMessageResponse) => {
        setEditMessageId(msg.id);
        setEditValue(msg.content || "");
    };

    // 메시지 수정 완료
    const handleEditConfirm = async (messageId: number) => {
        if (!channelId || !editValue.trim()) return;

        const promise = updateMessage(parseInt(channelId), messageId, editValue.trim());
        toast.promise(promise, {
            loading: '수정 중...',
            success: (response) => {
                setMessages(prev => prev.map(m => m.id === messageId ? response.data : m));
                setEditMessageId(null);
                setEditValue("");
                return <b>수정 완료!</b>;
            },
            error: <b>수정에 실패했습니다.</b>
        });
    };

    // 메시지 삭제
    const handleRemoveMsg = async (messageId: number) => {
        if (!channelId || !window.confirm("메시지를 삭제하시겠습니까?")) return;

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

    // 엔터키로 전송 (Shift+Enter는 줄바꿈)
    const handleInputKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    // 파일 첨부
    const handleClipClick = () => fileInputRef.current?.click();
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };
    const handleRemoveFile = () => setFile(null);

    if (isLoading) {
        return <div className={styles.chatContainer}>로딩 중...</div>
    }

    return (
        <div className={styles.chatContainer}>
            <div className={styles.chatArea} ref={chatAreaRef}>
                {messages.map((msg) => (
                    <div className={styles.chatMessageRow} key={msg.id}>
                        {msg.isMine ? (
                            <div className={`${styles.chatMessageRow} ${styles.myMessageRow}`}>
                                <div className={`${styles.chatMessage} ${styles.myMessage}`}>
                                    <div className={styles.iconLeft}>
                                        <FontAwesomeIcon icon={faThumbTack} className={`${styles.pinIcon}`} title="공지로 등록" />
                                        <FontAwesomeIcon icon={faPencil} className={styles.pencilIcon} onClick={() => handleEditStart(msg)} />
                                        <FontAwesomeIcon icon={faTrashCan} className={styles.trashcanIcon} onClick={() => handleRemoveMsg(msg.id)} />
                                    </div>
                                    {editMessageId === msg.id ? (
                                        <textarea
                                            ref={editInputRef}
                                            value={editValue}
                                            onChange={e => setEditValue(e.target.value)}
                                            onKeyDown={e => {
                                                if (e.key === "Enter" && !e.shiftKey) {
                                                    e.preventDefault();
                                                    handleEditConfirm(msg.id);
                                                }
                                                if (e.key === "Escape") {
                                                    setEditMessageId(null);
                                                    setEditValue("");
                                                }
                                            }}
                                            className={styles.EditInput}
                                        />
                                    ) : (
                                        msg.content && <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>{msg.content}</ReactMarkdown>
                                    )}
                                    {msg.fileUrl && msg.fileName && <FilePreviewItem fileUrl={msg.fileUrl} fileName={msg.fileName} />}
                                </div>
                                <span className={styles.timeLeft}>{new Date(msg.createdAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                        ) : (
                            <div className={`${styles.chatMessageRow} ${styles.otherMessageRow}`}>
                                <div className={styles.profileArea}>
                                    <img src={"https://i.imgur.com/5cLDeXy.png"} className={styles.profileImg} alt={msg.userName} />
                                    <div className={styles.username}>{msg.userName}</div>
                                </div>
                                <div className={`${styles.chatMessage} ${styles.otherMessage}`}>
                                    <div className={styles.iconRight}>
                                        <FontAwesomeIcon icon={faThumbTack} className={`${styles.pinIcon}`} title="공지로 등록" />
                                    </div>
                                    {msg.content && <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>{msg.content}</ReactMarkdown>}
                                    {msg.fileUrl && msg.fileName && <FilePreviewItem fileUrl={msg.fileUrl} fileName={msg.fileName} />}
                                </div>
                                <span className={styles.timeRight}>{new Date(msg.createdAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <div className={styles.chatWrapper}>
                {file && (
                    <div className={styles.filePreviewList}>
                        <span className={styles.filePreviewItem}>
                            {file.name}
                            <button className={styles.removeFileButton} onClick={handleRemoveFile} type="button" aria-label="파일 삭제">
                                <FontAwesomeIcon icon={faXmark} />
                            </button>
                        </span>
                    </div>
                )}
                <div className={styles.chatInputWrapper}>
                    <button className={styles.attachButton} onClick={handleClipClick}><FontAwesomeIcon icon={faPaperclip} /></button>
                    <textarea value={input} placeholder="메시지를 입력하세요..." className={styles.chatInput} onChange={e => setInput(e.target.value)} onKeyDown={handleInputKeyDown} />
                    <button className={styles.sendButton} onClick={handleSend}><FontAwesomeIcon icon={faPaperPlane} className={styles.sendIcon} /></button>
                </div>
            </div>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} />
        </div>
    );
};

export default ChatPage;