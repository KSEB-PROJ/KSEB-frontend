import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import NoticePage from './NoticePage/NoticePage';
import CalendarPage from './CalendarPage';
import ChatPage from './ChatPage/ChatPage';
import styles from './ChannelPage.module.css';
import { getChannelDetail } from '../../api/channels';
import type { Channel } from '../../types';
import { useChannelStore } from '../../stores/channelStore'; // 스토어 import 추가

const ChannelLayout: React.FC = () => {
    const { groupId, channelId } = useParams<{ groupId: string; channelId: string }>();
    const [channel, setChannel] = useState<Channel | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { setSelectedChannel } = useChannelStore(); // 스토어 액션 가져오기

    useEffect(() => {
        if (groupId && channelId) {
            const fetchChannelDetails = async () => {
                setLoading(true);
                setError(null);
                try {
                    const response = await getChannelDetail(parseInt(groupId), parseInt(channelId));
                    const data = response.data;

                    const formattedChannel: Channel = {
                        ...data,
                        description: data.description || `이곳은 ${data.name} 채널입니다.`
                    };

                    setChannel(formattedChannel);
                    setSelectedChannel(formattedChannel); // [수정] 스토어 상태 업데이트
                } catch (err) {
                    console.error("Failed to fetch channel details:", err);
                    setError("채널 정보를 불러오는 데 실패했습니다.");
                    setSelectedChannel(null); // [수정] 실패 시 스토어 상태 초기화
                } finally {
                    setLoading(false);
                }
            };

            fetchChannelDetails();
        }
        
        // 컴포넌트가 언마운트될 때 선택된 채널을 null로 설정하여 정리합니다.
        return () => {
            setSelectedChannel(null);
        }
    }, [groupId, channelId, setSelectedChannel]);


    if (loading) {
        return <div style={{ padding: '2rem' }}>채널 정보를 불러오는 중...</div>;
    }

    if (error) {
        return <div style={{ padding: '2rem', color: 'red' }}>{error}</div>;
    }

    if (!channel) {
        return <div>채널을 찾을 수 없습니다.</div>;
    }

    const renderChannelPage = () => {
        switch (channel.channelTypeCode.toLowerCase()) {
            case 'notice':
                return <NoticePage />;
            case 'calendar':
                return <CalendarPage groupId={parseInt(groupId!)} />;
            case 'chat':
                return <ChatPage />;
            default:
                return <div>알 수 없는 채널 타입입니다: {channel.channelTypeCode}</div>;
        }
    };

    return (
        <div className={styles.channelContainer}>
            <header className={`${styles.channelHeader} ${channel.channelTypeCode.toLowerCase() === 'notice' ? styles.noticeHeader : ''}`}>
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