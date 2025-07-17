/**
 * ChatbotSidebar 컴포넌트
 *
 * AI 챗봇을 위한 사이드바.
 * - 열림/닫힘 상태(isOpen)에 따라 슬라이딩 애니메이션과 함께 표시.
 * - 닫기 버튼 클릭 시 onClose 콜백을 호출하여 부모 컴포넌트에 상태 변경 알림.
 *
 * 사용된 라이브러리 및 기술 스택: 
 * - React: 컴포넌트 작성 및 Props 전달
 * - TypeScript: Props에 대한 타입 안정성 제공
 * - CSS Modules: 로컬 스코프 스타일링(styles 객체)
 * - @fortawesome/react-fontawesome: 아이콘 렌더링 컴포넌트
 * - @fortawesome/free-solid-svg-icons: paperclip, paper-plane, times 아이콘
 */

import React from 'react';
import styles from './ChatbotSidebar.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaperclip, faPaperPlane, faTimes } from '@fortawesome/free-solid-svg-icons';

// 컴포넌트가 받을 Props 타입 정의.
interface ChatbotSidebarProps {
    /**
     * 사이드바가 열려 있는지 여부를 나타내는 boolean 값.
     * true: 열림, false: 닫힘
     */
    isOpen: boolean;
    /**
     * 닫기 버튼 클릭 시 호출되는 콜백 함수.
     * 부모 컴포넌트에서 상태를 업데이트하는 로직.
     */
    onClose: () => void;
}

// React.FC 타입을 사용해 함수형 컴포넌트를 정의하고, Props 타입을 제네릭으로 전달.
const ChatbotSidebar: React.FC<ChatbotSidebarProps> = ({ isOpen, onClose }) => {
    return (
        // aside 태그를 사용해 시맨틱하게 사이드바 영역을 나타냄.
        // isOpen 값에 따라 open 스타일을 추가해 CSS 애니메이션 트리거.
        <aside className={`${styles.chatbotContainer} ${isOpen ? styles.open : ''}`}>  
            {/* 헤더 영역: 챗봇 타이틀과 닫기 버튼 */}
            <div className={styles.header}>
                {/* 챗봇 이름 */}
                <h3>AI 챗봇</h3>
                {/* 닫기 버튼: 클릭 시 onClose 콜백 호출 */}
                <button onClick={onClose} className={styles.closeButton}>
                    <FontAwesomeIcon icon={faTimes} />
                </button>
            </div>

            {/* 채팅 메시지 표시 영역 */}
            <div className={styles.chatArea}>
                {/**
                 * 실제 구현 시에는 메시지 배열을 map으로 순회.(아마도?))
                 * 예시 구현을 위해 단일 div로만 표시 디자인은 수정 (예정)
                 */}
                <div className={styles.chatMessage}>
                    <p>안녕하세요! 무엇을 도와드릴까요?</p>
                </div>
            </div>

            {/* 사용자의 입력을 받는 영역: 첨부, 입력창, 전송 */}
            <div className={styles.inputArea}>
                {/* 파일 첨부 버튼: 추후 파일 선택 핸들러 추가 가능 */}
                <button className={styles.attachButton}>
                    <FontAwesomeIcon icon={faPaperclip} />
                </button>
                {/* 텍스트 입력 필드: 입력값은 상태로 관리하여 전송 로직과 연결 */}
                <input
                    type="text"
                    placeholder="메시지를 입력하세요..."
                    className={styles.inputField}
                />
                {/* 전송 버튼: 클릭 시 입력된 메시지를 서버나 API로 전송 */}
                <button className={styles.sendButton}>
                    <FontAwesomeIcon icon={faPaperPlane} />
                </button>
            </div>
        </aside>
    );
};

export default ChatbotSidebar;
