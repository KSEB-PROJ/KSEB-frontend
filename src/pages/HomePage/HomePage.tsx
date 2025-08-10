import React, { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styles from './HomePage.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faArrowRight, faCalendarAlt, faVideo, faThumbtack, faClock,
    faUsers, faComments, faTimes, faHashtag, faBullhorn, faCalendarDays
} from '@fortawesome/free-solid-svg-icons';
import dayjs from 'dayjs';
import 'dayjs/locale/ko';
import relativeTime from 'dayjs/plugin/relativeTime';

// store
import { useAuthStore } from '../../stores/authStore';
import { useGroupStore } from '../../stores/groupStore';
import { useEventStore } from '../../stores/eventStore';
import { useNoticeStore } from '../../stores/noticeStore';
import { useChannelStore } from '../../stores/channelStore';
import type { ScheduleEvent, Notice, Channel } from '../../types';

dayjs.extend(relativeTime);
dayjs.locale('ko');

const HomePage: React.FC = () => {
    const { user } = useAuthStore();
    const { selectedGroup } = useGroupStore();
    const { events, fetchEvents } = useEventStore();
    const { notices, fetchNotices } = useNoticeStore();
    const { channels } = useChannelStore();

    const [isMounted, setIsMounted] = useState(false);
    const [modalContent, setModalContent] = useState<'members' | 'channels' | null>(null);

    const navigate = useNavigate();

    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        if (selectedGroup) {
            fetchEvents(selectedGroup.id);
            fetchNotices(selectedGroup.id);
        }
    }, [selectedGroup, fetchEvents, fetchNotices]);

    const todaysEvents = useMemo((): ScheduleEvent[] => {
        if (!events) return [];
        return events
            .filter(event => dayjs(event.start).isSame(dayjs(), 'day'))
            .sort((a, b) => dayjs(a.start).valueOf() - dayjs(b.start).valueOf());
    }, [events]);

    const recentNotices = useMemo((): Notice[] => {
        if (!notices) return [];
        return [...notices]
            .sort((a, b) => dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf())
            .slice(0, 5);
    }, [notices]);

    const handleOpenModal = (content: 'members' | 'channels') => {
        if (selectedGroup) {
            setModalContent(content);
        }
    };
    const handleCloseModal = () => setModalContent(null);

    const handleChannelClick = (channelId: number) => {
        if (selectedGroup) {
            navigate(`/app/groups/${selectedGroup.id}/channels/${channelId}`);
            handleCloseModal();
        }
    };

    const getChannelIcon = (typeCode: string) => {
        switch (typeCode.toLowerCase()) {
            case 'notice': return faBullhorn;
            case 'calendar': return faCalendarDays;
            default: return faHashtag;
        }
    };

    const coreChannels = useMemo(() => {
        const notice = channels.find(c => c.channelTypeCode.toLowerCase() === 'notice');
        const calendar = channels.find(c => c.channelTypeCode.toLowerCase() === 'calendar');
        return [notice, calendar].filter(Boolean) as Channel[];
    }, [channels]);

    return (
        <div className={styles.homeContainer}>
            <div className={`${styles.gridContainer} ${isMounted ? styles.mounted : ''}`}>
                <div className={`${styles.gridItem} ${styles.heroWidget}`}>
                    <div className={styles.heroContent}>
                        <h1 className={styles.welcomeTitle}>아이디어를 현실로 만드는 공간</h1>
                        <p className={styles.welcomeSubtitle}>{user?.name}님, 오늘 당신의 창의력을 마음껏 펼쳐보세요.</p>
                    </div>
                </div>

                <div className={`${styles.gridItem} ${styles.groupStatusWidget}`}>
                    {selectedGroup ? (
                        <>
                            <div className={styles.widgetHeader}>
                                <div>
                                    <h3 className={styles.widgetTitle}>{selectedGroup.name}</h3>
                                    <p className={styles.widgetSubtitle}>그룹 워크스페이스</p>
                                </div>
                                <div className={styles.statusCounters}>
                                    <div className={styles.counterItem} onClick={() => handleOpenModal('members')}>
                                        <FontAwesomeIcon icon={faUsers} />
                                        <span>{selectedGroup.members?.length || 0}</span>
                                    </div>
                                    <div className={styles.counterItem} onClick={() => handleOpenModal('channels')}>
                                        <FontAwesomeIcon icon={faComments} />
                                        <span>{channels?.length || 0}</span>
                                    </div>
                                </div>
                            </div>
                            <div className={styles.widgetBody}>
                                <div className={styles.coreChannelGrid}>
                                    {coreChannels.map(channel => (
                                        <div key={channel.id} className={styles.coreChannelCard} onClick={() => handleChannelClick(channel.id)}>
                                            <FontAwesomeIcon icon={getChannelIcon(channel.channelTypeCode)} />
                                            <span>{channel.name}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className={styles.noGroup}>
                            <h3>그룹을 선택하거나 생성하여<br />협업을 시작하세요.</h3>
                        </div>
                    )}
                </div>

                <Link to="/app/schedule" className={`${styles.gridItem} ${styles.actionCard}`}>
                    <div className={styles.cardIcon}><FontAwesomeIcon icon={faCalendarAlt} /></div>
                    <h3>통합 스케줄</h3>
                    <p>개인과 팀의 모든 일정을 한 곳에서 관리하세요.</p>
                    <span className={styles.cardLink}>바로가기 <FontAwesomeIcon icon={faArrowRight} /></span>
                </Link>

                <Link to="/app/feedback" className={`${styles.gridItem} ${styles.actionCard}`}>
                    <div className={styles.cardIcon}><FontAwesomeIcon icon={faVideo} /></div>
                    <h3>AI 발표 코칭</h3>
                    <p>AI의 객관적인 피드백으로 당신의 발표를 완성하세요.</p>
                    <span className={styles.cardLink}>시작하기 <FontAwesomeIcon icon={faArrowRight} /></span>
                </Link>

                <div className={`${styles.gridItem} ${styles.agendaWidget}`}>
                    <h3 className={styles.widgetTitle}><FontAwesomeIcon icon={faClock} /> 오늘의 일정</h3>
                    <div className={styles.eventList}>
                        {todaysEvents.length > 0 ? (
                            todaysEvents.map(event => (
                                <div key={event.id} className={styles.eventItem} style={{ '--event-color': event.color } as React.CSSProperties}>
                                    <div className={styles.eventDetails}>
                                        <span className={styles.eventTitle}>{event.title}</span>
                                        <span className={styles.eventOwner}>{event.ownerType === 'GROUP' ? event.groupName : '개인 일정'}</span>
                                    </div>
                                    <span className={styles.eventTime}>
                                        {event.allDay ? '하루 종일' : `${dayjs(event.start).format('HH:mm')} - ${dayjs(event.end).format('HH:mm')}`}
                                    </span>
                                </div>
                            ))
                        ) : (<p className={styles.emptyMessage}>오늘 예정된 일정이 없습니다.</p>)}
                    </div>
                </div>

                <div className={`${styles.gridItem} ${styles.noticeWidget}`}>
                    <h3 className={styles.widgetTitle}><FontAwesomeIcon icon={faThumbtack} /> 최신 공지사항</h3>
                    <div className={styles.noticeList}>
                        {recentNotices.length > 0 ? (
                            recentNotices.map(notice => (
                                <div key={notice.id} className={styles.noticeItem}>
                                    <p className={styles.noticeContent}>{notice.content}</p>
                                    <span className={styles.noticeMeta}>{notice.userName} · {dayjs(notice.createdAt).fromNow()}</span>
                                </div>
                            ))
                        ) : (<p className={styles.emptyMessage}>새로운 공지사항이 없습니다.</p>)}
                    </div>
                </div>
            </div>

            {modalContent && (
                <div className={styles.modalOverlay} onClick={handleCloseModal}>
                    <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h3>{modalContent === 'members' ? '멤버 목록' : '채널 목록'}</h3>
                            <button onClick={handleCloseModal}><FontAwesomeIcon icon={faTimes} /></button>
                        </div>
                        <div className={styles.listContainer}>
                            {modalContent === 'members' && selectedGroup?.members.map(member => (
                                <div key={member.userId} className={styles.listItem}>
                                    <FontAwesomeIcon icon={faUsers} className={styles.listItemIcon} />
                                    <span className={styles.listItemName}>{member.userName}</span>
                                    <span className={styles.listItemRole}>{member.role}</span>
                                </div>
                            ))}
                            {modalContent === 'channels' && channels.map(channel => (
                                <div key={channel.id} className={styles.listItem} onClick={() => handleChannelClick(channel.id)} style={{ cursor: 'pointer' }}>
                                    <FontAwesomeIcon icon={getChannelIcon(channel.channelTypeCode)} className={styles.listItemIcon} />
                                    <span className={styles.listItemName}>{channel.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HomePage;