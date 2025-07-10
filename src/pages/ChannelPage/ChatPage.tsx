import React, { useRef, useState } from 'react';
import styles from './ChatPage.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaperPlane, faXmark, faPaperclip } from '@fortawesome/free-solid-svg-icons';
type ChatMessage = {
    text?: string;
    sender: "me" | "other";
    files?: File[];
    time?:string;
}
const ChatPage: React.FC = () => {
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const [files, setFiles] = useState<File[]>([]);
    const [input, setInput] = useState("");
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const handleSend = () => {
        if (input.trim() === "" && files.length === 0) return; // 빈칸 방지
        const now = new Date();
        const hour = String(now.getHours()).padStart(2, "0");
        const min = String(now.getMinutes()).padStart(2, "0");
        const time = `${hour}:${min}`;
        setMessages(prev => [...prev, { text: input.trim()? input : undefined, sender: "me", files: files.length > 0 ? files : undefined, time, }]);
        setInput(""); // 입력창 비우기
        setFiles([]);
    };
    //엔터키로 전송
    const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") handleSend();
    };
    //파일 첨부 클릭
    const handleClipClick = () => {
        fileInputRef.current?.click();
    };
    //파일 추가
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setFiles(Array.from(e.target.files));
        }
    };
    //파일 삭제
    const handleRemoveFile = (index: number) => {
        setFiles((prevFiles) => prevFiles.filter((_, idx) => idx !== index));
    };

    return (
        <div className={styles.chatContainer}>
            {/* 채팅 메시지 출력 영역 */}
            <div className={styles.chatArea}>
                {messages.map((msg, idx) => (
                    <div
                        key={idx}
                        className={`${styles.chatMessage} ${
                            msg.sender === "me" ? styles.myMessage : styles.otherMessage
                        }`}
                    >
                        {msg.text && <p>{msg.text}</p>}
                        {msg.files && msg.files.length > 0 && (
                            <div className={styles.fileInChatList}>
                                {msg.files.map((file, fileIdx) => (
                                    <div key={fileIdx} className={styles.fileInChat}>
                                        {file.name}
                                    </div>
                                ))}
                            </div>
                        )}
                        {msg.time && (
                                    <span className={msg.sender === "me"? styles.chatTimeMe: styles.chatTimeOther}>{msg.time}</span>
                            )}
                    </div>
                ))}   
            </div>
            {/* 채팅 입력 영역 */}
            <div className={styles.chatWrapper}>
                {files.length > 0 && (
                    <div className={styles.filePreviewList}>
                        {files.map((file, idx) => (
                        <span key={idx} className={styles.filePreviewItem}>{file.name}
                        <button className={styles.removeFileButton}
                            onClick={() => handleRemoveFile(idx)}
                            type="button"
                            aria-label="파일 삭제"
                        >
                            <FontAwesomeIcon icon={faXmark}></FontAwesomeIcon>
                        </button>
                        </span>
                        ))}
                    </div>
                )}
                <div className={styles.chatInputWrapper}>
                    <button className={styles.attachButton} onClick={handleClipClick}>
                        <FontAwesomeIcon icon={faPaperclip} />
                    </button>
                    <input type="text" placeholder="메시지를 입력하세요..." className={styles.chatInput} value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={handleInputKeyDown}/>
                    <button className={styles.sendButton} onClick={handleSend}>
                        <FontAwesomeIcon icon={faPaperPlane} className={styles.sendIcon} />
                    </button>
                </div>
            </div>
            {/* 숨겨진 파일 인풋 */}
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    multiple
                    style={{ display: 'none' }}
                />
        </div>
    );
};

export default ChatPage;