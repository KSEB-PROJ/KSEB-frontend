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
import ChatbotSidebar from '../../components/ChatbotSidebar/ChatbotSidebar';
import EventEditorModal from './SchedulePage/EventEditorModal/EventEditorModal'; // 모달 컴포넌트 import
import { useEventStore } from '../../stores/eventStore'; // 전역 스토어 import
import type { ScheduleEvent } from '../../types';
import styles from './AppLayout.module.css';


const AppLayout: React.FC = () => {
    // --- 로컬 UI 상태 ---
    const [isSidebarOpen, setSidebarOpen] = useState(true);
    const [isChatbotOpen, setChatbotOpen] = useState(false);

    // --- 전역 이벤트 모달 상태 ---
    const { 
        isModalOpen, 
        selectedEvent, 
        closeModal, 
        saveEvent, 
        deleteEvent, 
        fetchEvents 
    } = useEventStore();

    const toggleSidebar = () => setSidebarOpen(prev => !prev);
    const toggleChatbot = () => setChatbotOpen(prev => !prev);

    // --- 모달 이벤트 핸들러 ---
    const handleSaveEvent = async (eventData: ScheduleEvent) => {
        const result = await saveEvent(eventData);
        if (result.success) {
            closeModal();
            fetchEvents(); // 데이터 최신화
        }
        return result;
    };

    const handleDeleteEvent = async (eventId: string) => {
        const eventToDelete = useEventStore.getState().events.find(e => e.id.startsWith(eventId));
        if (eventToDelete) {
            await deleteEvent(eventToDelete);
            closeModal();
        }
    };

    return (
        <div className={styles.appContainer}>
            <Sidebar
                isOpen={isSidebarOpen}
                onToggle={toggleSidebar}
                onChatbotToggle={toggleChatbot}
                isChatbotOpen={isChatbotOpen}
            />

            <main
                className={
                    `${styles.mainContent}` +
                    ` ${isSidebarOpen ? styles.contentShifted : ''}` +
                    ` ${isChatbotOpen ? styles.contentShrink : ''}`
                }
            >
                <Outlet />
            </main>

            <ChatbotSidebar isOpen={isChatbotOpen} onClose={toggleChatbot} />

            {/* 전역 이벤트 모달 렌더링 로직 */}
            {isModalOpen && (
                <EventEditorModal
                    event={selectedEvent}
                    onClose={closeModal}
                    onSave={handleSaveEvent}
                    onDelete={handleDeleteEvent}
                    onEventUpdate={fetchEvents}
                />
            )}
        </div>
    );
};

export default AppLayout;
