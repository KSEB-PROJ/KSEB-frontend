/**
 * AppLayout 페이지
 * 애플리케이션의 전체 레이아웃 정의
 * - 사이드바(메인 메뉴) 영역
 * - 챗봇 사이드바 영역
 * - 메인 컨텐츠 영역 (라우팅된 페이지 출력)
 *
 * 주요 역할:
 * 1. 사이드바 토글 상태 관리
 * 2. 챗봇 사이드바 토글 상태 관리
 * 3. Outlet을 통해 자식 라우트 컴포넌트 렌더링
 */

import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../../components/Sidebar/Sidebar';
import ChatbotSidebar from '../../components/ChatbotSidebar/ChatbotSidebar'; // 챗봇 사이드바
import styles from './AppLayout.module.css';


const AppLayout: React.FC = () => {
    // 사이드바 열림/닫힘 상태 (기본: 열림)
    const [isSidebarOpen, setSidebarOpen] = useState(true);
    // 챗봇 사이드바 열림/닫힘 상태 (기본: 닫힘)
    const [isChatbotOpen, setChatbotOpen] = useState(false);

    /**
     * 햄버거 아이콘 클릭 시 호출
     * 사이드바 열림/닫힘 상태를 반전.
     */
    const toggleSidebar = () => {
        setSidebarOpen(prev => !prev);
    };

    /**
     * 챗봇 아이콘 클릭 시 호출
     * 챗봇 사이드바 열림/닫힘 상태를 반전.
     */
    const toggleChatbot = () => {
        setChatbotOpen(prev => !prev);
    };

    return (
        // .appContainer: 전체 레이아웃 그리드/플렉스 설정
        <div className={styles.appContainer}>
            {/* 메인 사이드바: 열림/닫힘, 챗봇 클릭 핸들러, 챗봇 활성 상태 전달 */}
            <Sidebar
                isOpen={isSidebarOpen}
                onToggle={toggleSidebar}
                onChatbotToggle={toggleChatbot}
                isChatbotOpen={isChatbotOpen}
            />

            {/*
              메인 컨텐츠 영역
              - 사이드바 열린 상태면 contentShifted 클래스 적용
              - 챗봇 열린 상태면 contentShrink 클래스 적용
              - Outlet을 통해 라우트된 페이지 컴포넌트 렌더링
            */}
            <main
                className={
                    `${styles.mainContent}` +
                    ` ${isSidebarOpen ? styles.contentShifted : ''}` +
                    ` ${isChatbotOpen ? styles.contentShrink : ''}`
                }
            >
                <Outlet />
            </main>

            {/* 챗봇 사이드바: isOpen 값에 따라 표시 여부, onClose로 닫기 처리 */}
            <ChatbotSidebar isOpen={isChatbotOpen} onClose={toggleChatbot} />
        </div>
    );
};

export default AppLayout;
