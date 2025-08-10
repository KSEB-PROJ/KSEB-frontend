import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom'; // useNavigate 추가
import styles from './HomePage.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faArrowRight, faCalendarAlt, faVideo, faThumbtack, faClock, 
    faUsers, faComments, faTimes, faHashtag, faBullhorn, faCalendarDays 
} from '@fortawesome/free-solid-svg-icons';
import dayjs from 'dayjs';
import 'dayjs/locale/ko';
import relativeTime from 'dayjs/plugin/relativeTime';

// 필요한 스토어들을 가져옵니다.
import { useAuthStore } from '../../stores/authStore';
import { useGroupStore } from '../../stores/groupStore';
import { useEventStore } from '../../stores/eventStore';
import { useNoticeStore } from '../../stores/noticeStore';
import { useChannelStore } from '../../stores/channelStore'; // 👈 [추가] 채널 스토어 import
import type { ScheduleEvent, Notice } from '../../types';

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
    
    const navigate = useNavigate(); // useNavigate 훅 사용

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
    
    // 채널 클릭 시 해당 페이지로 이동하는 함수
    const handleChannelClick = (channelId: number) => {
        if (selectedGroup) {
            navigate(`/app/groups/${selectedGroup.id}/channels/${channelId}`);
            handleCloseModal(); // 모달 닫기
        }
    };

    const getChannelIcon = (typeCode: string) => {
        switch (typeCode.toLowerCase()) {
            case 'notice': return faBullhorn;
            case 'calendar': return faCalendarDays;
            default: return faHashtag;
        }
    };

    return (
        <div className={styles.homeContainer}>
            <div className={`${styles.heroWidget} ${isMounted ? styles.mounted : ''}`}>
                <div className={styles.heroContent}>
                    <h1 className={styles.welcomeTitle}>{dayjs().format('A h:mm')}</h1>
                    <p className={styles.welcomeSubtitle}>좋은 하루 보내고 계신가요, {user?.name}님?</p>
                </div>
            </div>

            <div className={`${styles.gridContainer} ${isMounted ? styles.mounted : ''}`}>
                <Link to="/app/schedule" className={`${styles.gridItem} ${styles.actionCard}`}>
                    <FontAwesomeIcon icon={faCalendarAlt} />
                    <h3>개인 스케줄 관리</h3>
                    <p>시간표와 일정을 통합 관리하세요.</p>
                    <span className={styles.cardLink}>바로가기 <FontAwesomeIcon icon={faArrowRight} /></span>
                </Link>
                <Link to="/app/feedback" className={`${styles.gridItem} ${styles.actionCard}`}>
                    <FontAwesomeIcon icon={faVideo} />
                    <h3>발표 피드백</h3>
                    <p>AI 코칭으로 발표 실력을 높여보세요.</p>
                    <span className={styles.cardLink}>시작하기 <FontAwesomeIcon icon={faArrowRight} /></span>
                </Link>

                <div className={`${styles.gridItem} ${styles.groupStatusWidget}`}>
                    {selectedGroup ? (
                        <>
                            <h3 className={styles.widgetTitle}>{selectedGroup.name} 현황</h3>
                            <div className={styles.statusGrid}>
                                <div className={styles.statusItem} onClick={() => handleOpenModal('members')}>
                                    <FontAwesomeIcon icon={faUsers} />
                                    <span>멤버</span>
                                    <p>{selectedGroup.members?.length || 0}명</p>
                                </div>
                                <div className={styles.statusItem} onClick={() => handleOpenModal('channels')}>
                                    <FontAwesomeIcon icon={faComments} />
                                    <span>채널</span>
                                    <p>{channels?.length || 0}개</p>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className={styles.noGroup}><p>그룹을 선택하여<br />주요 현황을 확인하세요.</p></div>
                    )}
                </div>

                <div className={`${styles.gridItem} ${styles.agendaWidget}`}>
                    <h3 className={styles.widgetTitle}><FontAwesomeIcon icon={faClock} /> 오늘의 일정</h3>
                    <div className={styles.eventList}>
                        {todaysEvents.length > 0 ? (
                            todaysEvents.map(event => (
                                <div key={event.id} className={styles.eventItem}>
                                    <div className={styles.eventColorDot} style={{ backgroundColor: event.color }} />
                                    <div className={styles.eventDetails}>
                                        <span className={styles.eventTitle}>{event.title}</span>
                                        <span className={styles.eventOwner}>{event.ownerType === 'GROUP' ? event.groupName : '개인 일정'}</span>
                                    </div>
                                    <span className={styles.eventTime}>
                                        {event.allDay ? '하루 종일' : dayjs(event.start).format('HH:mm')}
                                    </span>
                                </div>
                            ))
                        ) : ( <p className={styles.emptyMessage}>오늘 예정된 일정이 없습니다.</p> )}
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
                        ) : ( <p className={styles.emptyMessage}>새로운 공지사항이 없습니다.</p> )}
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
