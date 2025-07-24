/**
 * @file Sidebar.tsx
 * @description Zustand 스토어를 사용하여 리팩토링된 사이드바 컴포넌트입니다.
 */

import React from 'react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { NavLink, useLocation, Link, useNavigate } from 'react-router-dom';
import styles from './Sidebar.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { IconDefinition } from '@fortawesome/free-solid-svg-icons';
import {
    faHome, faCalendarAlt, faCommentDots, faVideo, faBullhorn, faAnglesLeft,
    faPlus, faRobot, faGripVertical, faTimes, faSignOutAlt, faUserEdit, faCopy
} from '@fortawesome/free-solid-svg-icons';
import toast from 'react-hot-toast';
import { AxiosError } from 'axios';

// Dnd-kit
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// 컴포넌트
import CreateChannelModal from '../CreateChannelModal/CreateChannelModal';
import CreateGroupModal from '../CreateGroupModal/CreateGroupModal';

// Zustand 스토어
import { useAuthStore } from '../../stores/authStore';
import { useGroupStore } from '../../stores/groupStore';
import { useChannelStore } from '../../stores/channelStore';

// 타입
import type { ChannelListDto } from '../../types/channel';
import type { Group } from '../../types/group';

// 메뉴 아이템 정의
type MenuItem = { path: string; icon: IconDefinition; text: string; id?: undefined; } | { id: string; icon: IconDefinition; text: string; path?: undefined; };
const mainMenuItems: MenuItem[] = [
    { path: '/app/home', icon: faHome, text: '홈' },
    { path: '/app/schedule', icon: faCalendarAlt, text: '개인 스케줄 입력' },
    { path: '/app/feedback', icon: faVideo, text: '발표 피드백' },
    { id: 'chatbot', icon: faRobot, text: '챗봇' },
];

interface Channel extends ChannelListDto {
    isDraggable: boolean;
    type: 'notice' | 'calendar' | 'chat';
    channelTypeName: string;
}

interface SortableChannelProps {
    channel: Channel;
    isOpen: boolean;
    elementRef: (el: HTMLLIElement | null) => void;
    selectedGroupId: number;
}

const SortableChannel: React.FC<SortableChannelProps> = ({ channel, isOpen, elementRef, selectedGroupId }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: channel.id, disabled: !channel.isDraggable });
    const style = { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 1 : 0 };
    const getIconForChannel = (typeCode: string) => {
        switch (typeCode.toLowerCase()) {
            case 'notice': return faBullhorn;
            case 'calendar': return faCalendarAlt;
            case 'chat': default: return faCommentDots;
        }
    };

    return (
        <li
            ref={(node) => { setNodeRef(node); elementRef(node); }}
            style={style}
            {...attributes}
            className={`${styles.channelItem} ${channel.isDraggable && isOpen ? styles.draggableItem : ''}`}
        >
            <NavLink to={`/app/groups/${selectedGroupId}/channels/${channel.id}`} className={({ isActive }) => `${styles.channelLink} ${isActive ? styles.active : ''}`}>
                {channel.isDraggable && (
                    <div {...listeners} className={styles.dragHandle}>
                        <FontAwesomeIcon icon={faGripVertical} />
                    </div>
                )}
                <div className={styles.channelContent}>
                    <FontAwesomeIcon icon={getIconForChannel(channel.channelTypeCode)} className={styles.icon} />
                    <h5 className={`${styles.menuText} ${isOpen ? styles.openText : ''}`}>{channel.name}</h5>
                </div>
            </NavLink>
        </li>
    );
};

interface SidebarProps {
    isOpen: boolean; onToggle: () => void; onChatbotToggle: () => void; isChatbotOpen: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onToggle, onChatbotToggle, isChatbotOpen }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, logout } = useAuthStore();
    const { groups, selectedGroup, isLoading: isGroupLoading, fetchGroups, setSelectedGroup } = useGroupStore();
    const { channels, isLoading: isChannelLoading, addChannel } = useChannelStore();

    // UI 상태
    const [isGroupOverlayOpen, setGroupOverlayOpen] = useState(false);
    const [isChannelModalOpen, setIsChannelModalOpen] = useState(false);
    const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
    const [isProfileMenuOpen, setProfileMenuOpen] = useState(false);
    const [mainIndicatorStyle, setMainIndicatorStyle] = useState({});
    const [channelIndicatorStyle, setChannelIndicatorStyle] = useState({});
    const [hoveredId, setHoveredId] = useState<number | null>(null);
    const [dndChannels, setDndChannels] = useState<Channel[]>([]);

    // DOM 참조
    const mainmenuRefs = useRef<(HTMLLIElement | null)[]>([]);
    const channelRefs = useRef<(HTMLLIElement | null)[]>([]);
    const profileMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => { fetchGroups(); }, [fetchGroups]);
    useEffect(() => { setDndChannels(channels as Channel[]); }, [channels]);
    const handleGroupUpdate = useCallback(() => { fetchGroups(); }, [fetchGroups]);

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            setDndChannels((prev) => arrayMove(prev, prev.findIndex(c => c.id === active.id), prev.findIndex(c => c.id === over.id)));
        }
    };

    const handleCreateChannel = async (channelName: string) => {
        if (!selectedGroup) return;
        await toast.promise(
            addChannel(selectedGroup.id, { name: channelName, channelTypeId: 1 }),
            {
                loading: '채널 생성 중...',
                success: () => { setIsChannelModalOpen(false); return <b>'#{channelName}' 채널이 생성되었습니다!</b>; },
                error: (err: AxiosError<{ message?: string }>) => err.response?.data?.message || '채널 생성에 실패했습니다.',
            }
        );
    };

    const handleSelectGroup = (group: Group) => { if (selectedGroup?.id !== group.id) setSelectedGroup(group); setGroupOverlayOpen(false); };
    const copyCodeToClipboard = (code: string) => { navigator.clipboard.writeText(code).then(() => toast.success(`'${code}' 코드가 복사되었습니다.`)); };
    const handleLogout = () => { logout(); toast.success('안전하게 로그아웃되었습니다.'); navigate('/login'); };

    useEffect(() => {
        const mainIndex = mainMenuItems.findIndex(item => item.path === location.pathname);
        const mainActiveEl = mainIndex > -1 ? mainmenuRefs.current[mainIndex] : null;
        if (mainActiveEl) setMainIndicatorStyle({ top: mainActiveEl.offsetTop, height: mainActiveEl.offsetHeight, opacity: 1 });
        else setMainIndicatorStyle(prev => ({ ...prev, opacity: 0 }));

        const channelIndex = dndChannels.findIndex(c => location.pathname.includes(`/channels/${c.id}`));
        const channelActiveEl = channelIndex > -1 ? channelRefs.current[channelIndex] : null;
        if (channelActiveEl) setChannelIndicatorStyle({ top: channelActiveEl.offsetTop + (channelActiveEl.offsetHeight / 2), opacity: 1 });
        else setChannelIndicatorStyle(prev => ({ ...prev, opacity: 0 }));
    }, [location.pathname, isOpen, dndChannels]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => { if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) setProfileMenuOpen(false); };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

    return (
        <>
            {isChannelModalOpen && <CreateChannelModal onClose={() => setIsChannelModalOpen(false)} onCreate={handleCreateChannel} />}
            {isGroupModalOpen && <CreateGroupModal onClose={() => setIsGroupModalOpen(false)} onGroupUpdate={handleGroupUpdate} initialColorName={selectedGroup?.color || 'purple'} />}

            <nav className={`${styles.menu} ${isOpen ? styles.open : ''}`}>
                <div className={styles.actionBar}>
                    {isGroupLoading ? (
                        <div className={styles.groupDisplay}>
                            <h3 className={`${styles.menuText} ${isOpen ? styles.openText : ''}`}>로딩중...</h3>
                        </div>
                    ) : selectedGroup ? (
                        <>
                            <div className={styles.groupCrest} onClick={() => setGroupOverlayOpen(true)}>
                                <div className={styles.crestInner}>{selectedGroup.initials}</div>
                            </div>
                            <div className={styles.groupDisplay}>
                                <h3 className={`${styles.menuText} ${isOpen ? styles.openText : ''}`}>{selectedGroup.name}</h3>
                            </div>
                        </>
                    ) : (
                        <div className={styles.groupDisplay} onClick={() => setIsGroupModalOpen(true)} style={{ cursor: 'pointer' }}>
                            <h3 className={`${styles.menuText} ${isOpen ? styles.openText : ''}`}>그룹 참가/생성</h3>
                        </div>
                    )}
                </div>

                <div className={`${styles.groupOverlay} ${isGroupOverlayOpen ? styles.open : ''}`} onClick={() => setGroupOverlayOpen(false)}>
                    <div className={styles.timelineContainer} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.timelineConnector} />
                        <div className={styles.timeline} onMouseLeave={() => setHoveredId(selectedGroup?.id ?? null)}>
                            {groups.map(group => (
                                <div key={group.id} className={`${styles.groupItem} ${selectedGroup?.id === group.id ? styles.groupItemSelected : ''} ${hoveredId === group.id ? styles.groupItemHovered : ''}`} onMouseEnter={() => setHoveredId(group.id)} onClick={() => handleSelectGroup(group)}>
                                    <div className={styles.itemDot} style={{ '--item-color': group.colorValue } as React.CSSProperties} />
                                    <div className={styles.itemContent}>
                                        <div className={styles.itemHeader}>
                                            <span className={styles.itemName}>{group.name}</span>
                                            {selectedGroup?.id === group.id && <span className={styles.selectedBadge} style={{ '--item-color': group.colorValue } as React.CSSProperties}>Current</span>}
                                        </div>
                                        <div className={styles.itemDetails}>
                                            <div className={styles.inviteCode}>
                                                <span>{group.code}</span>
                                                <button onClick={e => { e.stopPropagation(); copyCodeToClipboard(group.code) }}>
                                                    <FontAwesomeIcon icon={faCopy} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <div className={`${styles.groupItem} ${styles.addGroupItem}`} onMouseEnter={() => setHoveredId(0)} onClick={() => { setGroupOverlayOpen(false); setIsGroupModalOpen(true); }}>
                                <div className={styles.itemDot} />
                                <div className={styles.itemContent}>
                                    <div className={styles.itemHeader}>
                                        <span className={styles.itemName}>새로운 그룹 생성/참여</span>
                                        <FontAwesomeIcon icon={faPlus} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <button onClick={() => setGroupOverlayOpen(false)} className={styles.closeOverlayBtn}>
                        <FontAwesomeIcon icon={faTimes} />
                    </button>
                </div>

                <ul className={styles.optionsBar}>
                    <div className={styles.activeIndicator} style={mainIndicatorStyle}></div>
                    {mainMenuItems.map((item, index) => (
                        <li key={item.path || item.id} className={styles.menuItem} ref={el => { mainmenuRefs.current[index] = el; }}>
                            {item.path ? (
                                <NavLink to={item.path} className={({ isActive }) => `${styles.menuOption} ${isActive ? styles.active : ''}`}>
                                    <FontAwesomeIcon icon={item.icon} className={styles.icon} />
                                    <h5 className={`${styles.menuText} ${isOpen ? styles.openText : ''}`}>{item.text}</h5>
                                </NavLink>
                            ) : (
                                <div onClick={onChatbotToggle} className={`${styles.menuOption} ${isChatbotOpen ? styles.chatbotActive : ''}`}>
                                    <FontAwesomeIcon icon={item.icon} className={styles.icon} />
                                    <h5 className={`${styles.menuText} ${isOpen ? styles.openText : ''}`}>{item.text}</h5>
                                </div>
                            )}
                        </li>
                    ))}
                </ul>

                <div className={styles.menuBreak}><hr /></div>

                {selectedGroup && (
                    <div className={styles.channelSection}>
                        <div className={styles.channelHeader}>
                            <h4 className={`${styles.menuText} ${isOpen ? styles.openText : ''}`}>채널</h4>
                            {isOpen && <button onClick={() => setIsChannelModalOpen(true)} className={styles.addChannelBtn}><FontAwesomeIcon icon={faPlus} /></button>}
                        </div>
                        {isChannelLoading ? (
                            <div className={`${styles.menuText} ${isOpen ? styles.openText : ''}`} style={{ padding: '0 10px' }}>채널 로딩중...</div>
                        ) : (
                            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                                <SortableContext items={dndChannels.map(c => c.id)} strategy={verticalListSortingStrategy}>
                                    <ul className={styles.optionsBarChannel}>
                                        <div className={styles.channelActiveIndicator} style={channelIndicatorStyle}></div>
                                        {dndChannels.map((channel, index) => (
                                            <SortableChannel key={channel.id} channel={channel} isOpen={isOpen} elementRef={el => { channelRefs.current[index] = el; }} selectedGroupId={selectedGroup.id} />
                                        ))}
                                    </ul>
                                </SortableContext>
                            </DndContext>
                        )}
                    </div>
                )}

                <div className={styles.collapseSection}>
                    <button className={styles.collapseButton} onClick={onToggle}>
                        <FontAwesomeIcon icon={faAnglesLeft} className={styles.collapseIcon} />
                        <span className={`${styles.menuText} ${isOpen ? styles.openText : ''}`}>Collapse</span>
                    </button>
                </div>

                <div className={styles.profileSection} ref={profileMenuRef}>
                    <div className={styles.profileLink} onClick={() => setProfileMenuOpen(prev => !prev)}>
                        <div className={styles.profileDetails}>
                            <img
                                src={user?.profileImg ? `${import.meta.env.VITE_PUBLIC_URL}${user.profileImg}` : `${import.meta.env.VITE_PUBLIC_URL}/profile-images/default-profile.png`}
                                alt="profile"
                                className={styles.profileIcon}
                                style={{ borderRadius: '50%', objectFit: 'cover', padding: 0 }}
                            />
                            <div className={`${styles.profileTextContainer} ${isOpen ? styles.openText : ''}`}>
                                <span className={styles.profileName}>{user?.name || '...'}</span>
                                <span className={styles.profileRole}>{user?.email || '...'}</span>
                            </div>
                        </div>
                    </div>
                    {isProfileMenuOpen && (
                        <div className={styles.profileMenu}>
                            <Link to="/app/profile" className={styles.profileMenuItem} onClick={() => setProfileMenuOpen(false)}>
                                <FontAwesomeIcon icon={faUserEdit} />
                                <span>프로필 수정</span>
                            </Link>
                            <div className={`${styles.profileMenuItem} ${styles.logoutAction}`} onClick={handleLogout}>
                                <FontAwesomeIcon icon={faSignOutAlt} />
                                <span>로그아웃</span>
                            </div>
                        </div>
                    )}
                </div>
            </nav>
        </>
    );
};
export default Sidebar;