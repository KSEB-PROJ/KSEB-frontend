import React, { useState, useRef, useEffect } from 'react';
import styles from './ChatbotSidebar.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaperPlane, faSync, faRobot } from '@fortawesome/free-solid-svg-icons';
import { useChannelStore } from '../../stores/channelStore';
import { useChatbotStore } from '../../stores/chatbotStore';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const ChatbotSidebar = () => {
    const { messages, isLoading, sendMessage, resetConversation } = useChatbotStore();
    // [수정] 스토어의 상태를 올바르게 구독하도록 수정
    const selectedChannel = useChannelStore((state) => state.selectedChannel);

    const [input, setInput] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading || !selectedChannel) return;
        await sendMessage(input, selectedChannel.id);
        setInput('');
    };

    return (
        <div className={styles.chatbotContainer}>
            <div className={styles.header}>
                <h3>AI 어시스턴트</h3>
                <button onClick={resetConversation} className={styles.resetButton} title="대화 초기화">
                    <FontAwesomeIcon icon={faSync} />
                </button>
            </div>

            <div className={styles.messageArea}>
                {messages.map((msg, index) => (
                    <div key={index} className={`${styles.messageWrapper} ${styles[msg.author]}`}>
                        {msg.author === 'ai' && (
                            <div className={styles.avatar}>
                                <FontAwesomeIcon icon={faRobot} />
                            </div>
                        )}
                        <div className={styles.bubble}>
                            {/* [수정] 사용하지 않는 'node' prop 제거 */}
                            <Markdown remarkPlugins={[remarkGfm]} components={{
                                table: ({ ...props }) => <table className={styles.markdownTable} {...props} />,
                                thead: ({ ...props }) => <thead className={styles.markdownThead} {...props} />,
                                tr: ({ ...props }) => <tr className={styles.markdownTr} {...props} />,
                                th: ({ ...props }) => <th className={styles.markdownTh} {...props} />,
                                td: ({ ...props }) => <td className={styles.markdownTd} {...props} />,
                            }}>{msg.text}</Markdown>
                        </div>
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
                        placeholder={selectedChannel ? "AI에게 메시지 보내기..." : "채널을 먼저 선택해주세요."}
                        disabled={isLoading || !selectedChannel}
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