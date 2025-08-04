import React, { useState, useRef, useEffect } from 'react';
import styles from './ChatbotSidebar.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaperPlane, faSync, faRobot, faTimes } from '@fortawesome/free-solid-svg-icons';
import { useChannelStore } from '../../stores/channelStore';
import { useChatbotStore } from '../../stores/chatbotStore';
import type { ChatMessage as Message } from '../../stores/chatbotStore';
import ChatMessage from '../ChatbotMessages/ChatMessage';

interface ChatbotSidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

const ChatbotSidebar: React.FC<ChatbotSidebarProps> = ({ isOpen, onClose }) => {
    const { messages, isLoading, sendMessage, resetConversation } = useChatbotStore();
    const selectedChannel = useChannelStore((state) => state.selectedChannel);

    const [input, setInput] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        // 이제 채널 선택 여부와 관계없이 AI 챗봇 사용 가능 
        // 단, 채널 관련 기능은 selectedChannel이 있을 때만 동작하도록 분기 처리 필요
        const channelId = selectedChannel?.id || 0; // 채널 ID가 없으면 0 또는 다른 기본값 전달
        if (!input.trim() || isLoading) return;

        await sendMessage(input, channelId);
        setInput('');
    };
    
    // ESC 키로 닫기
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };
        if (isOpen) {
            window.addEventListener('keydown', handleKeyDown);
        }
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, onClose]);


    return (
        <div className={`${styles.chatbotContainer} ${isOpen ? styles.open : ''}`}>
            <div className={styles.header}>
                <div className={styles.headerTitle}>
                    <FontAwesomeIcon icon={faRobot} />
                    <h3>AI 어시스턴트</h3>
                </div>
                <div className={styles.headerActions}>
                    <button onClick={resetConversation} className={styles.headerButton} title="대화 초기화">
                        <FontAwesomeIcon icon={faSync} />
                    </button>
                    <button onClick={onClose} className={styles.headerButton} title="닫기 (ESC)">
                        <FontAwesomeIcon icon={faTimes} />
                    </button>
                </div>
            </div>

            <div className={styles.messageArea}>
                {messages.map((msg: Message, index) => (
                    <div key={index} className={`${styles.messageWrapper} ${styles[msg.author]}`}>
                        {msg.author === 'ai' && (
                            <div className={styles.avatar}>
                                <FontAwesomeIcon icon={faRobot} />
                            </div>
                        )}
                        <ChatMessage message={msg} />
                    </div>
                ))}
                {isLoading && (
                    <div className={`${styles.messageWrapper} ${styles.ai}`}>
                        <div className={styles.avatar}>
                            <FontAwesomeIcon icon={faRobot} />
                        </div>
                        <div className={styles.bubble}>
                            <span className={styles.loadingDots}></span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <div className={styles.inputFormWrapper}>
                <form onSubmit={handleSubmit} className={styles.inputArea}>
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={"AI에게 무엇이든 물어보세요..."}
                        disabled={isLoading}
                    />
                    <button type="submit" disabled={isLoading || !input.trim()}>
                        <FontAwesomeIcon icon={faPaperPlane} />
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ChatbotSidebar;