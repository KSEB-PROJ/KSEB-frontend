import React, { useRef, useState,useEffect } from 'react';
import styles from './ChatPage.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaperPlane, faXmark,faFilePowerpoint, faPaperclip,faFilePdf, faFileWord, faFileExcel, faFileImage, faFileVideo, faFileAudio, faFileAlt } from '@fortawesome/free-solid-svg-icons';
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
// 타입
type ChatMessage = {
    text?: string;
    sender: "me" | "other";
    files?: File[];
    time?:string;
    profileImg?: string; // 프로필 사진 URL
}
//파일 미리보기 아이콘
const getFileIcon = (file: File) => {
    const type = file.type;
    if (type.startsWith("image/")) return faFileImage;
    if (type.startsWith("video/")) return faFileVideo;
    if (type.startsWith("audio/")) return faFileAudio;
    if (file.name.endsWith(".pdf")) return faFilePdf;
    if (file.name.match(/\.(doc|docx)$/)) return faFileWord;
    if (file.name.match(/\.(xls|xlsx)$/)) return faFileExcel;
    return faFileAlt;
};
const getFileIconClass = (file: File) => {
    const type = file.type;
    if (type.startsWith("image/")) return styles["fileIcon--image"];
    if (type.startsWith("video/")) return styles["fileIcon--video"];
    if (type.startsWith("audio/")) return styles["fileIcon--audio"];
    if (file.name.endsWith(".pdf"))  return styles["fileIcon--pdf"];
    if (file.name.match(/\.(doc|docx)$/)) return styles["fileIcon--word"];
    if (file.name.match(/\.(xls|xlsx)$/)) return styles["fileIcon--excel"];
    return styles["fileIcon--etc"];
};
//파일 미리보기 컴포넌트
export const FilePreviewItem: React.FC<{file: File; size?: number;}> = ({ file, size = 80 }) => {
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  React.useEffect(() => {
    if (file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [file]);
//이미지 썸네일
  if (file.type.startsWith("image/") && previewUrl) {
    return (
      <div
        className={styles.img}
        style={{ width: size, height: size }}  /* 크기만 prop으로 조절 */
      >
        <img src={previewUrl} alt={file.name} />
      </div>
    );
  }
  // 아이콘+파일명(가로 직사각형으로)
  return (
     <div className={styles.fileBox}>
    <FontAwesomeIcon icon={getFileIcon(file)} size="lg" className={`${styles.fileIcon} ${getFileIconClass(file)}`}/>
    <span className={styles.fileName}>{file.name}</span>
  </div>
  );
};
//메인 컴포넌트
const ChatPage: React.FC = () => {
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const [files, setFiles] = useState<File[]>([]);
    const [input, setInput] = useState("");
    const chatAreaRef = useRef<HTMLDivElement | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            sender: "other",
            text: "안녕하세요! 저는 상대방이에요 ",
            profileImg: "https://randomuser.me/api/portraits/men/1.jpg",
            time: "09:00",
        },
        {
            sender: "other",
            text: "안녕하세요! 저는 상대방이에요 ",
            profileImg: "https://randomuser.me/api/portraits/men/1.jpg",
            time: "09:00",
        },
        {
            sender: "me",
            text: "네, 안녕하세요!",
            time: "09:01",
        }        
    ]);
    //전송
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
    //스크롤 항상 아래로
    useEffect(() => {
        if (chatAreaRef.current) {
            chatAreaRef.current.scrollTop = chatAreaRef.current.scrollHeight;
        }
        }, [messages]);
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
            <div className={styles.chatArea} ref={chatAreaRef}>
                {messages.map((msg, idx) => (
                    <div className={styles.chatMessageRow} key={idx}style={{
                            justifyContent: msg.sender === "me" ? "flex-end" : "flex-start"}}>
                        {msg.sender === "me" ? (
                            <>
                                <span className={styles.timeLeft}>{msg.time}</span>
                                {msg.text? (
                                    /* 텍스트가 있으면 기존 말풍선 */
                                    <div className={`${styles.chatMessage} ${styles.myMessage}`}>
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.text}</ReactMarkdown>
                                        {/* 마크다운: # 제목, **굵게**, *기울임*, ~~취소선~~ */}
                                        {msg.files && msg.files.length > 0 && (
                                            <div className={styles.fileInChatList}>
                                                {msg.files.map((file, fileIdx) => (
                                                    <FilePreviewItem key={fileIdx} file={file} />
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    /* 텍스트가 없으면 말풍선 없이 파일 미리보기만 */
                                    msg.files && (
                                    <div className={styles.fileInChatList}>
                                        {msg.files.map((file, fileIdx) => (
                                            <FilePreviewItem key={fileIdx} file={file} />
                                        ))}
                                    </div>
                                ) 
                            )}
                        </>
                    ) : (
                            <>
                                {/* 프로필/이름 영역 추가 */}
                                <div className={styles.profileArea}>
                                    <img
                                        src={msg.profileImg || "https://i.imgur.com/5cLDeXy.png"}
                                        className={styles.profileImg}
                                    />
                                </div>
                                {msg.text ? (
                                    <div className={`${styles.chatMessage} ${styles.otherMessage}`}>
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.text}</ReactMarkdown>
                                        {msg.files && msg.files.length > 0 && (
                                            <div className={styles.fileInChatList}>
                                                {msg.files.map((file, fileIdx) => (
                                                    <FilePreviewItem key={fileIdx} file={file} />
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    ) : (
                                        msg.files && (
                                            <div className={styles.fileInChatList}>
                                                {msg.files.map((file, fileIdx) => (
                                                    <FilePreviewItem key={fileIdx} file={file} />
                                                ))}
                                            </div>
                                        )
                                    )}
                                <span className={styles.timeRight}>{msg.time}</span>
                            </>
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