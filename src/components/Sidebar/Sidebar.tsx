/**
 * 
 * ## 사용 기술/라이브러리:
 * - FontAwesome: 아이콘
 * - @dnd-kit: 드래그 앤 드롭(Sortable, DndContext 등)
 * - CSS Modules: 스타일링
 * 
 * ## 협업 참고/확장 포인트:
 * - 그룹 및 채널(방) 목록/생성 모달 등은 상태 관리로 오픈/닫기
 * - 드래그 앤 드롭 채널 정렬, 직접 구현 필요하면 @dnd-kit 문서 참고
 * - 그룹/채널 추가/변경 등은 실제 API 연동시 backend 연동 로직으로 확장 가능
 * - 유저 프로필/접근 권한 등은 props/컨텍스트로 확장 용이
 *
 */

import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import styles from './Sidebar.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { type IconDefinition, faHome, faCalendarAlt, faCommentDots, faVideo, faBullhorn, faAnglesLeft, faPlus, faUser, faRobot, faGripVertical, faTimes } from '@fortawesome/free-solid-svg-icons';

import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import CreateChannelModal from '../CreateChannelModal/CreateChannelModal';
import CreateGroupModal from '../CreateGroupModal/CreateGroupModal'; // 그룹 생성 모달 import

// 메뉴 아이템 타입 정의
type MenuItemLink = {
    path: string; id?: undefined; icon: IconDefinition; text: string;
};
type MenuItemAction = {
    id: string; path?: undefined; icon: IconDefinition; text: string;
};
type MenuItem = MenuItemLink | MenuItemAction;

const mainMenuItems: MenuItem[] = [
    { path: '/app/home', icon: faHome, text: '홈' },
    { path: '/app/schedule', icon: faCalendarAlt, text: '개인 스케줄 입력' },
    { path: '/app/feedback', icon: faVideo, text: '발표 피드백' },
    { id: 'chatbot', icon: faRobot, text: '챗봇' },
];

// 데이터 구조 정의
interface Channel {
    id: string; name: string; type: 'notice' | 'calendar' | 'chat'; isDraggable: boolean;
}
interface Group {
    id: number; name: string; color: string; colorValue: string; initials: string;
}

// SortableChannel 컴포넌트
interface SortableChannelProps {
    channel: Channel; isOpen: boolean; elementRef: (el: HTMLLIElement | null) => void;
}

const SortableChannel = ({ channel, isOpen, elementRef }: SortableChannelProps) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: channel.id,
        disabled: !channel.isDraggable,
    });
    const style = { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 1 : 0 };

    return (
        <li
            ref={(node) => { setNodeRef(node); elementRef(node); }}
            style={style} {...attributes}
            className={`${styles.channelItem} ${channel.isDraggable && isOpen ? styles.draggableItem : ''}`}
        >
            <NavLink to={`/app/channels/${channel.id}`} className={({ isActive }) => `${styles.channelLink} ${isActive ? styles.active : ''}`}>
                {channel.isDraggable && <div {...listeners} className={styles.dragHandle}><FontAwesomeIcon icon={faGripVertical} /></div>}
                <div className={styles.channelContent}>
                    <FontAwesomeIcon icon={channel.type === 'notice' ? faBullhorn : channel.type === 'calendar' ? faCalendarAlt : faCommentDots} className={styles.icon} />
                    <h5 className={`${styles.menuText} ${isOpen ? styles.openText : ''}`}>{channel.name}</h5>
                </div>
            </NavLink>
        </li>
    );
};

// 데이터
const initialGroups: Group[] = [
    { id: 1, name: 'Bloom Us 개발팀', color: 'purple', colorValue: '132, 0, 255', initials: 'B' },
    { id: 2, name: '캡스톤 디자인', color: 'teal', colorValue: '20, 214, 174', initials: '캡' },
];

const initialChannels: { [key: number]: Channel[] } = {
    1: [
        { id: 'notice-1', name: '공지사항', type: 'notice', isDraggable: false },
        { id: 'calendar-1', name: '개발 일정', type: 'calendar', isDraggable: false },
        { id: 'chat-1', name: '일반', type: 'chat', isDraggable: true },
        { id: 'chat-2', name: '프론트엔드', type: 'chat', isDraggable: true },
    ],
    2: [
        { id: 'notice-2', name: '필독 공지', type: 'notice', isDraggable: false },
        { id: 'calendar-2', name: '회의 일정', type: 'calendar', isDraggable: false },
        { id: 'chat-3', name: '회의록', type: 'chat', isDraggable: true },
    ],
};

// Sidebar 컴포넌트 Props
interface SidebarProps {
    isOpen: boolean; onToggle: () => void; onChatbotToggle: () => void; isChatbotOpen: boolean;
}

// Sidebar 본체
const Sidebar: React.FC<SidebarProps> = ({ isOpen, onToggle, onChatbotToggle, isChatbotOpen }) => {
    const location = useLocation();
    const [groups, setGroups] = useState<Group[]>(initialGroups);
    const [selectedGroup, setSelectedGroup] = useState<Group | null>(groups.length > 0 ? groups[0] : null);
    const [groupChannels, setGroupChannels] = useState<Channel[]>([]);
    const [isGroupOverlayOpen, setGroupOverlayOpen] = useState(false);
    const [isChannelModalOpen, setIsChannelModalOpen] = useState(false);
    const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);

    const [mainIndicatorStyle, setMainIndicatorStyle] = useState({ top: 0, height: 0, opacity: 0 });
    const [channelIndicatorStyle, setChannelIndicatorStyle] = useState({ top: 0, opacity: 0 });

    const mainmenuRefs = useRef<(HTMLLIElement | null)[]>([]);
    const channelRefs = useRef<(HTMLLIElement | null)[]>([]);

    // 그룹 변경 시 동작
    useEffect(() => {
        if (selectedGroup) {
            setGroupChannels(initialChannels[selectedGroup.id] || []);
            document.documentElement.style.setProperty('--group-color', selectedGroup.colorValue);
        } else if (groups.length > 0) {
            setSelectedGroup(groups[0]);
        }
    }, [selectedGroup, groups]);

    // 인디케이터 위치 업데이트
     useEffect(() => {
        // 메인 메뉴 인디케이터 위치 갱신
        const mainIndex = mainMenuItems.findIndex(item => item.path === location.pathname);
        const mainActiveEl = mainIndex > -1 ? mainmenuRefs.current[mainIndex] : null;
        if (mainActiveEl) {
            setMainIndicatorStyle({ top: mainActiveEl.offsetTop, height: mainActiveEl.offsetHeight, opacity: 1 });
        } else {
            setMainIndicatorStyle(prev => ({ ...prev, opacity: 0 }));
        }

        // 채널 메뉴 인디케이터 위치 갱신
        const channelIndex = groupChannels.findIndex(c => `/app/channels/${c.id}` === location.pathname);
        const channelActiveEl = channelIndex > -1 ? channelRefs.current[channelIndex] : null;
        if (channelActiveEl) {
            const top = channelActiveEl.offsetTop + (channelActiveEl.offsetHeight / 2);
            setChannelIndicatorStyle({ top, opacity: 1 });
        } else {
            setChannelIndicatorStyle(prev => ({ ...prev, opacity: 0 }));
        }
    }, [location.pathname, isOpen, groupChannels]);

    // ---- [드래그앤드롭 완료시] 채널 배열 순서 변경 ----
    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const oldIndex = groupChannels.findIndex(c => c.id === active.id);
            const newIndex = groupChannels.findIndex(c => c.id === over.id);
            setGroupChannels(arrayMove(groupChannels, oldIndex, newIndex));
        }
    };

    // ---- [채널 생성] 채널 생성 후 상태/원본 갱신 ----
    const handleCreateChannel = (channelName: string) => {
        if (!selectedGroup) return;
        const newChannel: Channel = { id: `chat-${Date.now()}`, name: channelName, type: 'chat', isDraggable: true };
        const updatedChannels = [...groupChannels, newChannel];
        setGroupChannels(updatedChannels);
        initialChannels[selectedGroup.id] = updatedChannels;
        setIsChannelModalOpen(false);
    };

    // ---- [그룹 생성] 새 그룹 추가 후 자동 선택 ----
    const handleCreateGroup = (groupData: { name: string; color: string; colorValue: string; }) => {
        const newGroup: Group = {
            id: Date.now(),
            name: groupData.name,
            color: groupData.color,
            colorValue: groupData.colorValue,
            initials: groupData.name.charAt(0).toUpperCase()
        };
        setGroups(prevGroups => [...prevGroups, newGroup]);
        setSelectedGroup(newGroup);
    };

    // ---- [그룹 선택] 그룹 오버레이에서 클릭시 그룹 전환 ----
    const handleSelectGroup = (group: Group) => {
        if (selectedGroup?.id !== group.id) {
            setSelectedGroup(group);
        }
        setGroupOverlayOpen(false);
    };

    // ---- [dnd-kit] 드래그 센서 세팅 ----
    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

    // ------- [6] 실제 사이드바 렌더 -------

    return (
        <>
            {/* 채널 생성 모달 (isChannelModalOpen) */}
            {isChannelModalOpen && <CreateChannelModal onClose={() => setIsChannelModalOpen(false)} onCreate={handleCreateChannel} />}
            {/* 그룹 생성 모달 (isGroupModalOpen) */}
            {isGroupModalOpen && selectedGroup && (
                <CreateGroupModal
                    onClose={() => setIsGroupModalOpen(false)}
                    onCreateGroup={handleCreateGroup}
                    initialColorName={selectedGroup.color}
                />
            )}
            
            <nav className={`${styles.menu} ${isOpen ? styles.open : ''}`}>
                {/* -- 상단: 그룹/팀 뱃지 & 이름 (클릭시 그룹 오버레이) -- */}
                <div className={styles.actionBar}>
                    {selectedGroup && (
                        <>
                            <div className={styles.groupCrest} onClick={() => setGroupOverlayOpen(true)}>
                                <div className={styles.crestInner}>{selectedGroup.initials}</div>
                            </div>
                            <div className={styles.groupDisplay}>
                                <h3 className={`${styles.menuText} ${isOpen ? styles.openText : ''}`}>{selectedGroup.name}</h3>
                            </div>
                        </>
                    )}
                </div>

                {/* -- 그룹 전환 오버레이(모달) -- */}
                <div className={`${styles.groupOverlay} ${isGroupOverlayOpen ? styles.open : ''}`} onClick={() => setGroupOverlayOpen(false)}>
                    {/* 컨텐츠 클릭시 오버레이 닫힘 막음 */}
                    <div className={styles.overlayContent} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.overlayHeader}>
                            <h4>Switch Group</h4>
                            <button onClick={() => setGroupOverlayOpen(false)} className={styles.closeOverlayBtn}>
                                <FontAwesomeIcon icon={faTimes} />
                            </button>
                        </div>
                        <div className={styles.groupGrid}>
                            {groups.map((group, index) => (
                                <div 
                                    key={group.id} 
                                    className={styles.groupCard} 
                                    style={{ 
                                        animationDelay: `${index * 80}ms`,
                                        '--group-hover-color': `rgba(${group.colorValue}, 0.2)` 
                                    } as React.CSSProperties}
                                    onClick={() => handleSelectGroup(group)}
                                >
                                    <div className={`${styles.groupCardCrest} ${styles[group.color]}`}>{group.initials}</div>
                                    <span className={styles.groupCardName}>{group.name}</span>
                                </div>
                            ))}
                            {/* 그룹 추가 버튼 */}
                            <div 
                                className={`${styles.groupCard} ${styles.createGroupCard}`} 
                                style={{ animationDelay: `${groups.length * 80}ms` }}
                                onClick={() => {
                                    setGroupOverlayOpen(false);
                                    setIsGroupModalOpen(true);
                                }}
                            >
                                <div className={styles.groupCardCrest}><FontAwesomeIcon icon={faPlus} /></div>
                                <span className={styles.groupCardName}>Create Group</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* -- 메인 네비 메뉴 -- */}
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

                {/* -- 구분선 -- */}
                <div className={styles.menuBreak}><hr /></div>

                {/* -- 채널(방) 리스트: 그룹별, dnd-kit으로 드래그 가능 -- */}
                {selectedGroup && (
                    <div className={styles.channelSection}>
                        <div className={styles.channelHeader}>
                            <h4 className={`${styles.menuText} ${isOpen ? styles.openText : ''}`}>채널</h4>
                            {isOpen && <button onClick={() => setIsChannelModalOpen(true)} className={styles.addChannelBtn}><FontAwesomeIcon icon={faPlus} /></button>}
                        </div>
                        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                            <SortableContext items={groupChannels.map(c => c.id)} strategy={verticalListSortingStrategy}>
                                <ul className={styles.optionsBarChannel}>
                                    <div className={styles.channelActiveIndicator} style={channelIndicatorStyle}></div>
                                    {groupChannels.map((channel, index) => (
                                        <SortableChannel key={channel.id} channel={channel} isOpen={isOpen} elementRef={el => { channelRefs.current[index] = el; }} />
                                    ))}
                                </ul>
                            </SortableContext>
                        </DndContext>
                    </div>
                )}
                
                {/* -- 사이드바 접기 버튼 -- */}
                <div className={styles.collapseSection}>
                    <button className={styles.collapseButton} onClick={onToggle}>
                        <FontAwesomeIcon icon={faAnglesLeft} className={styles.collapseIcon} />
                        <span className={`${styles.menuText} ${isOpen ? styles.openText : ''}`}>Collapse</span>
                    </button>
                </div>

                {/* -- 프로필 링크 -- */}
                <div className={styles.profileSection}>
                    <NavLink to="/app/profile" className={({ isActive }) => `${styles.profileLink} ${isActive ? styles.profileActive : ''}`}>
                        <div className={styles.profileDetails}>
                            <FontAwesomeIcon icon={faUser} className={styles.profileIcon} />
                            <div className={`${styles.profileTextContainer} ${isOpen ? styles.openText : ''}`}>
                                <span className={styles.profileName}>User Name</span>
                                <span className={styles.profileRole}>Edit Profile</span>
                            </div>
                        </div>
                    </NavLink>
                </div>
            </nav>
        </>
    );
};

export default Sidebar;