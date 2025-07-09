import React from 'react';
import styles from './ChannelPage.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaperPlane } from '@fortawesome/free-solid-svg-icons';

const ChatPage: React.FC = () => {
    return (
        <div className={styles.chatContainer}>
            {/* 채팅 메시지 출력 영역 */}
            <div className={styles.chatArea}>
                <div className={`${styles.chatMessage} ${styles.myMessage}`}>
                    <p>안녕하세요! 오늘 회의 8시 맞죠?</p>
                </div>
                <div className={`${styles.chatMessage} ${styles.otherMessage}`}>
                    <p>네 맞아요! 회의실에서 뵙겠습니다.</p>
                </div>
            </div>

            {/* 채팅 입력 영역 */}
            <div className={styles.chatInputWrapper}>
                <input type="text" placeholder="메시지를 입력하세요..." className={styles.chatInput} />
                <button className={styles.sendButton}>
                    <FontAwesomeIcon icon={faPaperPlane} />
                </button>
            </div>
        </div>
    );
};

export default ChatPage;