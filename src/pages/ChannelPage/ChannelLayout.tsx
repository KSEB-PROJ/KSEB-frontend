import React from 'react';
import { useParams } from 'react-router-dom';
import NoticePage from './NoticePage';
import CalendarPage from './CalendarPage';
import ChatPage from './ChatPage';
import styles from './ChannelPage.module.css';

// --- [채널 정보 타입 정의] ---
// - 각 채널의 이름(name), 종류(type: 공지/일정/채팅) 관리
interface Channel {
    name: string;
    type: 'notice' | 'calendar' | 'chat';
}

// --- [채널 전체 목록] ---
// - key: 채널 id (URL 파라미터와 매칭됨)
// - value: 채널 정보 객체 { name, type }
const allChannels: Record<string, Channel> = {
    'notice-1': { name: '공지사항', type: 'notice' },
    'calendar-1': { name: '개발 일정', type: 'calendar' },
    'chat-1': { name: '일반', type: 'chat' },
    'chat-2': { name: '프론트엔드', type: 'chat' },
    'notice-2': { name: '필독 공지', type: 'notice' },
    'calendar-2': { name: '회의 일정', type: 'calendar' },
    'chat-3': { name: '회의록', type: 'chat' },
};

// --- [채널 상세/메인 페이지 컴포넌트] ---
// - URL 파라미터(channelId)에 따라 해당 채널의 정보/화면을 표시
const ChannelLayout: React.FC = () => {
    // 현재 URL의 channelId 파라미터 추출 (예: /app/channels/chat-1)
    const { channelId } = useParams<{ channelId: string }>();

    // 현재 채널 정보 조회 (없으면 null)
    const channel = channelId ? allChannels[channelId] : null;

    // --- [유효하지 않은 채널 id일 때] ---
    if (!channel) {
        return <div>채널을 찾을 수 없습니다.</div>;
    }

    // --- [채널 타입별로 다른 컴포넌트 렌더링] ---
    // - type이 notice면 NoticePage, calendar면 CalendarPage, chat이면 ChatPage
    const renderChannelPage = () => {
        switch (channel.type) {
            case 'notice':
                return <NoticePage />;
            case 'calendar':
                return <CalendarPage />;
            case 'chat':
                return <ChatPage />;
            default:
                // 확장성: 미래에 알 수 없는 타입이 추가될 경우
                return <div>알 수 없는 채널 타입입니다.</div>;
        }
    };

    // --- [최종 채널 레이아웃 UI] ---
    // - 상단: 채널명/설명
    // - 하단: 해당 채널 타입별 메인 페이지 컴포넌트
    return (
        <div className={styles.channelContainer}>
            <header className={styles.channelHeader}>
                <h1>{channel.name}</h1>
                <p>이곳은 '{channel.name}' 채널입니다. 자유롭게 소통하고 정보를 공유하세요.</p>
            </header>
            <main className={styles.channelBody}>
                {renderChannelPage()}
            </main>
        </div>
    );
};

export default ChannelLayout;
