import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import NoticePage from './NoticePage/NoticePage';
import CalendarPage from './CalendarPage';
import ChatPage from './ChatPage';
import styles from './ChannelPage.module.css';
import axios from 'axios'; // [추가] axios import

// --- [채널 정보 타입 정의] ---
// - 각 채널의 이름(name), 종류(type: 공지/일정/채팅) 관리
// [수정] 채널 정보 타입을 API 응답에 맞게 확장
interface Channel {
    id: number;
    name: string;
    type: 'notice' | 'calendar' | 'chat';
    description: string;
    // 필요에 따라 추가적인 필드 정의
}

// --- [채널 상세/메인 페이지 컴포넌트] ---
// - URL 파라미터(channelId)에 따라 해당 채널의 정보/화면을 표시
const ChannelLayout: React.FC = () => {
    // 현재 URL의 channelId 파라미터 추출 (예: /app/channels/chat-1)
    const { channelId } = useParams<{ channelId: string }>();
    const [channel, setChannel] = useState<Channel | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (channelId) {
            const fetchChannelDetails = async () => {
                setLoading(true);
                setError(null);
                try {
                    // [수정] 실제 API 엔드포인트로 변경해야 합니다.
                    // 이 예시에서는 그룹 ID를 임의로 1로 가정합니다.
                    // 실제 애플리케이션에서는 현재 선택된 그룹 ID를 props나 context로부터 받아와야 합니다.
                    // URL에서 groupId를 추출하거나 상태 관리 라이브러리에서 가져와야 합니다.
                    // 여기서는 임시로 location state나 다른 방법을 가정하지 않고, URL 구조에 groupId가 없으므로 임의의 값을 사용합니다.
                    const groupId = 1; // 임시 그룹 ID. 실제로는 동적으로 받아와야 합니다.
                    const response = await axios.get(`/api/groups/${groupId}/${channelId}`, { withCredentials: true });

                    // API 응답 데이터를 프론트엔드 타입에 맞게 가공
                    const data = response.data;
                    const formattedChannel: Channel = {
                        id: data.id,
                        name: data.name,
                        type: data.channelTypeCode.toLowerCase(),
                        description: data.description || `이곳은 ${data.name} 채널입니다.` // description은 백엔드 응답에 따라 수정
                    };

                    setChannel(formattedChannel);
                } catch (err) {
                    console.error("Failed to fetch channel details:", err);
                    setError("채널 정보를 불러오는 데 실패했습니다.");
                } finally {
                    setLoading(false);
                }
            };

            fetchChannelDetails();
        }
    }, [channelId]);


    if (loading) {
        return <div style={{ padding: '2rem' }}>채널 정보를 불러오는 중...</div>;
    }

    if (error) {
        return <div style={{ padding: '2rem', color: 'red' }}>{error}</div>;
    }

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
            <header className={`${styles.channelHeader} ${channel.type === 'notice' ? styles.noticeHeader : ''}`}>
                <h1>{channel.name}</h1>
                <p>{channel.description}</p>
            </header>
            <main className={styles.channelBody}>
                {renderChannelPage()}
            </main>
        </div>
    );
};

export default ChannelLayout;