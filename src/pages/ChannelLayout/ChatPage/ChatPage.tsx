import React, { useRef, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import styles from './ChatPage.module.css';
import remarkBreaks from "remark-breaks";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faPaperPlane, faXmark, faPaperclip, faFilePdf, faFileWord,
    faFileExcel, faFileImage, faFileVideo, faFileAlt, faDownload, faExpand, faTimes,
    faPen, faTrash, faThumbtack, faCheck, faBan
} from '@fortawesome/free-solid-svg-icons';
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { ChatMessageResponse } from '../../../types';
import dayjs from 'dayjs';
import { useAuthStore } from '../../../stores/authStore';
import { useChatStore } from '../../../stores/chatStore';
import { useNoticeStore } from '../../../stores/noticeStore';
import toast from "react-hot-toast";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace('/api', '');

// Helper Functions
const forceDownload = (url: string, fileName: string) => {
    toast.promise(
        fetch(url).then(res => res.blob()).then(blob => {
            const blobUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = blobUrl;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(blobUrl);
        }),
        {
            loading: '다운로드 준비 중...',
            success: `${fileName} 다운로드 성공!`,
            error: '다운로드에 실패했습니다.',
        }
    );
};

const useAutoResize = (ref: React.RefObject<HTMLTextAreaElement | null>, value: string) => {
    useEffect(() => {
        if (ref.current) {
            ref.current.style.height = 'auto';
            ref.current.style.height = `${ref.current.scrollHeight}px`;
        }
    }, [ref, value]);
};

const getFileIcon = (fileName: string) => {
    if (fileName.endsWith(".pdf")) return faFilePdf;
    if (fileName.match(/\.(doc|docx)$/)) return faFileWord;
    if (fileName.match(/\.(xls|xlsx)$/)) return faFileExcel;
    if (fileName.match(/\.(png|jpg|jpeg|gif)$/)) return faFileImage;
    if (fileName.match(/\.(mp4|webm|mov)$/)) return faFileVideo;
    return faFileAlt;
};

// Child Components
const MediaViewerModal: React.FC<{ media: { url: string; type: ChatMessageResponse['messageType'], name: string }, onClose: () => void }> = ({ media, onClose }) => {
    const [isClosing, setIsClosing] = useState(false);
    const handleClose = () => {
        setIsClosing(true);
        setTimeout(onClose, 300);
    };
    const handleDownload = (e: React.MouseEvent) => {
        e.stopPropagation();
        forceDownload(media.url, media.name);
    };

    return (
        <div className={`${styles.mediaViewerOverlay} ${isClosing ? styles.closing : ''}`} onClick={handleClose}>
            <div className={styles.viewerHeader}>
                <span className={styles.viewerFileName}>{media.name}</span>
                <div className={styles.viewerActions}>
                    <button className={styles.viewerButton} onClick={handleDownload}><FontAwesomeIcon icon={faDownload} /></button>
                    <button className={styles.viewerButton} onClick={(e) => { e.stopPropagation(); handleClose(); }}><FontAwesomeIcon icon={faTimes} /></button>
                </div>
            </div>
            <div className={styles.mediaViewerContent} onClick={(e) => e.stopPropagation()}>
                {media.type === 'IMAGE' && <img src={media.url} alt={media.name} className={styles.viewerImage} />}
                {media.type === 'VIDEO' && <video src={media.url} controls autoPlay className={styles.viewerVideo} />}
            </div>
        </div>
    );
};

const MessageAttachment: React.FC<{ message: ChatMessageResponse, onMediaClick: (media: { url: string; type: ChatMessageResponse['messageType'], name: string }) => void }> = ({ message, onMediaClick }) => {
    if (!message.fileUrl || !message.fileName) return null;
    const fullUrl = `${API_BASE_URL}${message.fileUrl}`;

    if (message.messageType === 'IMAGE' || message.messageType === 'VIDEO') {
        return (
            <div className={styles.mediaContainer} onClick={() => onMediaClick({ url: fullUrl, type: message.messageType, name: message.fileName! })}>
                {message.messageType === 'IMAGE' ? <img src={fullUrl} alt={message.fileName} className={styles.imagePreview} /> : <video src={fullUrl} className={styles.videoPreview} />}
                <div className={styles.mediaOverlay}><span className={styles.viewAction}><FontAwesomeIcon icon={faExpand} /> 크게 보기</span></div>
            </div>
        );
    }

    return (
        <div className={styles.fileAttachmentWrapper}>
            <a href={fullUrl} target="_blank" rel="noopener noreferrer" className={styles.fileAttachmentLink}>
                <FontAwesomeIcon icon={getFileIcon(message.fileName)} className={styles.fileAttachmentIcon} />
                <div className={styles.fileAttachmentInfo}>
                    <span className={styles.fileAttachmentName}>{message.fileName}</span>
                    <span className={styles.fileAttachmentMeta}>새 탭에서 열기</span>
                </div>
            </a>
            <button onClick={() => forceDownload(fullUrl, message.fileName!)} className={styles.fileAttachmentDownloadBtn}><FontAwesomeIcon icon={faDownload} /></button>
        </div>
    );
};

const MessageEditor: React.FC<{ message: ChatMessageResponse, onCancel: () => void }> = ({ message, onCancel }) => {
    const { updateMessage } = useChatStore();
    const [content, setContent] = useState(message.content || '');
    const editInputRef = useRef<HTMLTextAreaElement>(null);
    useAutoResize(editInputRef, content);

    const handleSave = () => {
        if (content.trim()) {
            updateMessage(message.id, content.trim());
            onCancel();
        }
    };

    return (
        <div className={styles.editContainer}>
            <textarea ref={editInputRef} value={content} onChange={e => setContent(e.target.value)} className={styles.editInput} rows={1} />
            <div className={styles.editActions}>
                <button onClick={onCancel} className={`${styles.editButton} ${styles.cancelButton}`}><FontAwesomeIcon icon={faBan} /></button>
                <button onClick={handleSave} className={`${styles.editButton} ${styles.saveButton}`}><FontAwesomeIcon icon={faCheck} /></button>
            </div>
        </div>
    );
};

// Main Component
const ChatPage: React.FC = () => {
    const { channelId } = useParams<{ channelId: string }>();
    const { user, token } = useAuthStore();
    const { messages, connectAndSubscribe, disconnect, sendMessage, deleteMessage } = useChatStore();
    const { promoteToNotice } = useNoticeStore();

    const [input, setInput] = useState('');
    const [files, setFiles] = useState<File[]>([]);
    const [viewerMedia, setViewerMedia] = useState<{ url: string; type: ChatMessageResponse['messageType'], name: string } | null>(null);
    const [editingMessageId, setEditingMessageId] = useState<number | null>(null);
    const [confirmingDeleteId, setConfirmingDeleteId] = useState<number | null>(null);

    const chatAreaRef = useRef<HTMLDivElement | null>(null);
    const chatInputRef = useRef<HTMLTextAreaElement | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    useAutoResize(chatInputRef, input);

    useEffect(() => {
        if (channelId && token) {
            connectAndSubscribe(Number(channelId), token);
        }
        return () => { disconnect(); };
    }, [channelId, token, connectAndSubscribe, disconnect]);

    useEffect(() => {
        if (chatAreaRef.current) {
            chatAreaRef.current.scrollTop = chatAreaRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = () => {
        if (!input.trim() && files.length === 0) return;
        sendMessage(input, files);
        setInput('');
        setFiles([]);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) setFiles(prev => [...prev, ...Array.from(e.target.files!)]);
    };

    const removeFile = (fileToRemove: File) => setFiles(prev => prev.filter(f => f !== fileToRemove));

    return (
        <>
            <div className={styles.chatContainer}>
                <div className={styles.chatArea} ref={chatAreaRef}>
                    {messages.map((msg, index) => {
                        const lastMessage = messages[index - 1];
                        const showDateSeparator = !lastMessage || dayjs(msg.createdAt).format('YYYYMMDD') !== dayjs(lastMessage.createdAt).format('YYYYMMDD');
                        const isMine = msg.userId === user?.id;

                        return (
                            <React.Fragment key={msg.id}>
                                {showDateSeparator && (
                                    <div className={styles.dateSeparator}>
                                        <span>{dayjs(msg.createdAt).format('YYYY년 MM월 DD일')}</span>
                                    </div>
                                )}
                                <div className={`${styles.messageRow} ${isMine ? styles.myMessage : styles.otherMessage}`}>
                                    {!isMine && <div className={styles.authorInfo}><img src={msg.profileImgUrl ? `${API_BASE_URL}${msg.profileImgUrl}` : "https://i.imgur.com/5cLDeXy.png"} className={styles.avatar} alt={msg.userName} /></div>}
                                    <div className={styles.messageContent}>
                                        {!isMine && <div className={styles.authorName}>{msg.userName}</div>}
                                        
                                        {isMine && !msg.deleted && (
                                            <div className={styles.messageActions}>
                                                {confirmingDeleteId === msg.id ? (
                                                    <div className={styles.deleteConfirmContainer}>
                                                        <button onClick={() => deleteMessage(msg.id)} className={`${styles.messageActionButton} ${styles.confirmButton}`}><FontAwesomeIcon icon={faCheck} /></button>
                                                        <button onClick={() => setConfirmingDeleteId(null)} className={`${styles.messageActionButton} ${styles.cancelConfirmButton}`}><FontAwesomeIcon icon={faBan} /></button>
                                                    </div>
                                                ) : (
                                                    <>
                                                        {msg.messageType === 'TEXT' && <button onClick={() => setEditingMessageId(msg.id)} className={styles.messageActionButton}><FontAwesomeIcon icon={faPen} /></button>}
                                                        <button onClick={() => setConfirmingDeleteId(msg.id)} className={styles.messageActionButton}><FontAwesomeIcon icon={faTrash} /></button>
                                                        <button onClick={() => promoteToNotice(Number(channelId), msg.id)} className={styles.messageActionButton}><FontAwesomeIcon icon={faThumbtack} /></button>
                                                    </>
                                                )}
                                            </div>
                                        )}

                                        {editingMessageId === msg.id ? (
                                            <MessageEditor message={msg} onCancel={() => setEditingMessageId(null)} />
                                        ) : (
                                            <div className={styles.messageFragment}>
                                                {msg.deleted ? <em>{msg.content}</em> : <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>{msg.content}</ReactMarkdown>}
                                                {!msg.deleted && <MessageAttachment message={msg} onMediaClick={setViewerMedia} />}
                                            </div>
                                        )}

                                        <span className={styles.timestamp}>{dayjs(msg.createdAt).format('HH:mm')}</span>
                                    </div>
                                </div>
                            </React.Fragment>
                        );
                    })}
                </div>
                <div className={styles.chatInputArea}>
                    {files.length > 0 && (
                        <div className={styles.filePreviewList}>
                            {files.map((file) => (
                                <span key={`${file.name}-${file.lastModified}`} className={styles.filePreviewItem}>
                                    {file.name}
                                    <button className={styles.removeFileButton} onClick={() => removeFile(file)}><FontAwesomeIcon icon={faXmark} /></button>
                                </span>
                            ))}
                        </div>
                    )}
                    <div className={styles.inputRow}>
                        <button className={styles.sendButton} style={{ background: '#333' }} onClick={() => fileInputRef.current?.click()}><FontAwesomeIcon icon={faPaperclip} /></button>
                        <textarea ref={chatInputRef} value={input} placeholder="메시지를 입력하세요..." className={styles.chatInput} onChange={e => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }} rows={1} />
                        <button className={styles.sendButton} onClick={handleSend} disabled={!input.trim() && files.length === 0}><FontAwesomeIcon icon={faPaperPlane} /></button>
                    </div>
                </div>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} multiple />
            </div>
            {viewerMedia && <MediaViewerModal media={viewerMedia} onClose={() => setViewerMedia(null)} />}
        </>
    );
};

export default ChatPage;
