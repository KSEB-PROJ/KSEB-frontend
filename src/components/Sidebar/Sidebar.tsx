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

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { NavLink, useLocation, Link, useNavigate } from 'react-router-dom';
import styles from './Sidebar.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    type IconDefinition, faHome, faCalendarAlt, faCommentDots, faVideo, faBullhorn, faAnglesLeft, faPlus,
    faUser, faRobot, faGripVertical, faTimes, faSignOutAlt, faUserEdit, faCopy
} from '@fortawesome/free-solid-svg-icons';
import toast from 'react-hot-toast';

import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import CreateChannelModal from '../CreateChannelModal/CreateChannelModal';
import CreateGroupModal from '../CreateGroupModal/CreateGroupModal';
import { getMyGroups } from '../../api/groups';
import type { Group, GroupListDto } from '../../types/group';
import { logout } from '../../api/auth';
import { getChannelsByGroup, createChannel } from '../../api/channels';
import type { ChannelListDto } from '../../types/channel';


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

interface Channel extends ChannelListDto {
    isDraggable: boolean;
    type: 'notice' | 'calendar' | 'chat';
}

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

interface SidebarProps {
    isOpen: boolean; onToggle: () => void; onChatbotToggle: () => void; isChatbotOpen: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onToggle, onChatbotToggle, isChatbotOpen }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const [groups, setGroups] = useState<Group[]>([]);
    const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
    const [groupChannels, setGroupChannels] = useState<Channel[]>([]);
    const [isGroupOverlayOpen, setGroupOverlayOpen] = useState(false);
    const [isChannelModalOpen, setIsChannelModalOpen] = useState(false);
    const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
    const [isProfileMenuOpen, setProfileMenuOpen] = useState(false);
    const [mainIndicatorStyle, setMainIndicatorStyle] = useState({ top: 0, height: 0, opacity: 0 });
    const [channelIndicatorStyle, setChannelIndicatorStyle] = useState({ top: 0, opacity: 0 });
    const [hoveredId, setHoveredId] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isChannelLoading, setIsChannelLoading] = useState(false);

    const mainmenuRefs = useRef<(HTMLLIElement | null)[]>([]);
    const channelRefs = useRef<(HTMLLIElement | null)[]>([]);
    const profileMenuRef = useRef<HTMLDivElement>(null);
    const timelineRef = useRef<HTMLDivElement>(null);

    const fetchGroups = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await getMyGroups();
            const formattedGroups: Group[] = response.data.map((dto: GroupListDto) => ({
                id: dto.id,
                name: dto.name,
                code: dto.code,
                themeColor: dto.themeColor || '132, 0, 255',
                color: 'purple',
                colorValue: dto.themeColor || '132, 0, 255',
                initials: dto.name.charAt(0).toUpperCase(),
                members: [],
                memberCount: 0,
            }));

            setGroups(formattedGroups);

            setSelectedGroup(currentSelected => {
                const currentGroupExists = formattedGroups.some(g => g.id === currentSelected?.id);
                if (currentGroupExists) {
                    return formattedGroups.find(g => g.id === currentSelected!.id)!;
                }
                return formattedGroups.length > 0 ? formattedGroups[0] : null;
            });

        } catch (err) {
            toast.error("그룹 목록을 불러오는 데 실패했습니다.");
            console.error("fetchGroups error:", err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const handleGroupUpdate = useCallback(() => {
        fetchGroups();
    }, [fetchGroups]);

    useEffect(() => {
        fetchGroups();
    }, [fetchGroups]);

    useEffect(() => {
        if (isGroupOverlayOpen && selectedGroup) {
            setHoveredId(selectedGroup.id);
        }
    }, [isGroupOverlayOpen, selectedGroup]);

    useEffect(() => {
        if (selectedGroup) {
            document.documentElement.style.setProperty('--group-color', selectedGroup.colorValue);
            const fetchChannels = async () => {
                setIsChannelLoading(true);
                try {
                    const response = await getChannelsByGroup(selectedGroup.id);
                    const formattedChannels: Channel[] = response.data.map(dto => ({
                        ...dto,
                        isDraggable: dto.channelTypeCode === 'CHAT' && !dto.isSystem,
                        type: dto.channelTypeCode.toLowerCase() as 'notice' | 'calendar' | 'chat',
                    }));
                    setGroupChannels(formattedChannels);
                } catch (err) {
                    toast.error("채널 목록을 불러오는 데 실패했습니다.");
                    console.error("Failed to fetch channels:", err);
                    setGroupChannels([]);
                } finally {
                    setIsChannelLoading(false);
                }
            };
            fetchChannels();
        } else {
            setGroupChannels([]);
            document.documentElement.style.setProperty('--group-color', '132, 0, 255');
        }
    }, [selectedGroup]);


    useEffect(() => {
        const mainIndex = mainMenuItems.findIndex(item => item.path === location.pathname);
        const mainActiveEl = mainIndex > -1 ? mainmenuRefs.current[mainIndex] : null;
        if (mainActiveEl) {
            setMainIndicatorStyle({ top: mainActiveEl.offsetTop, height: mainActiveEl.offsetHeight, opacity: 1 });
        } else {
            setMainIndicatorStyle(prev => ({ ...prev, opacity: 0 }));
        }

        const channelIndex = groupChannels.findIndex(c => `/app/channels/${c.id}` === location.pathname);
        const channelActiveEl = channelIndex > -1 ? channelRefs.current[channelIndex] : null;
        if (channelActiveEl) {
            const top = channelActiveEl.offsetTop + (channelActiveEl.offsetHeight / 2);
            setChannelIndicatorStyle({ top, opacity: 1 });
        } else {
            setChannelIndicatorStyle(prev => ({ ...prev, opacity: 0 }));
        }
    }, [location.pathname, isOpen, groupChannels]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
                setProfileMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = async () => {
        await toast.promise(
            logout(),
            {
                loading: '로그아웃 중...',
                success: () => {
                    navigate('/login');
                    return <b>안전하게 로그아웃되었습니다.</b>;
                },
                error: '로그아웃에 실패했습니다. 다시 시도해주세요.',
            }
        );
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const oldIndex = groupChannels.findIndex(c => c.id === active.id);
            const newIndex = groupChannels.findIndex(c => c.id === over.id);
            setGroupChannels(arrayMove(groupChannels, oldIndex, newIndex));
        }
    };

    const handleCreateChannel = async (channelName: string) => {
        if (!selectedGroup) return;

        await toast.promise(
            createChannel(selectedGroup.id, { name: channelName, channelTypeId: 1 }),
            {
                loading: '채널 생성 중...',
                success: (res) => {
                    setIsChannelModalOpen(false);
                    const newChannelDto = res.data;
                    const formattedChannel: Channel = {
                        ...newChannelDto,
                        isDraggable: newChannelDto.channelTypeCode === 'CHAT' && !newChannelDto.isSystem,
                        type: newChannelDto.channelTypeCode.toLowerCase() as 'notice' | 'calendar' | 'chat',
                    };
                    setGroupChannels(prev => [...prev, formattedChannel]);
                    return <b>채널이 성공적으로 생성되었습니다!</b>;
                },
                error: '채널 생성에 실패했습니다. 다시 시도해주세요.',
            }
        );
    };

    const handleSelectGroup = async (group: Group) => {
        if (selectedGroup?.id !== group.id) {
            setSelectedGroup(group);
        }
        setGroupOverlayOpen(false);
    };

    const copyCodeToClipboard = (code: string) => {
        navigator.clipboard.writeText(code).then(() => {
            toast.success(`'${code}' 코드가 복사되었습니다.`);
        });
    };

    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

    return (
        <>
            {isChannelModalOpen && <CreateChannelModal onClose={() => setIsChannelModalOpen(false)} onCreate={handleCreateChannel} />}
            {isGroupModalOpen && (
                <CreateGroupModal
                    onClose={() => setIsGroupModalOpen(false)}
                    onGroupUpdate={handleGroupUpdate}
                    initialColorName={selectedGroup?.color || 'purple'}
                />
            )}

            <nav className={`${styles.menu} ${isOpen ? styles.open : ''}`}>
                <div className={styles.actionBar}>
                    {isLoading ? (
                        <div className={styles.groupDisplay}>
                            <h3 className={`${styles.menuText} ${isOpen ? styles.openText : ''}`}>로딩중...</h3>
                        </div>
                    ) : selectedGroup ? (
                        <>
                            {/* [오류 수정] 복잡한 인라인 스타일 대신 CSS 클래스를 사용하도록 변경 */}
                            <div className={styles.groupCrest} onClick={() => setGroupOverlayOpen(true)}>
                                <div className={styles.crestInner}>{selectedGroup.initials}</div>
                            </div>
                            <div className={styles.groupDisplay}>
                                <h3 className={`${styles.menuText} ${isOpen ? styles.openText : ''}`}>{selectedGroup.name}</h3>
                            </div>
                        </>
                    ) : (
                        <div className={styles.groupDisplay} onClick={() => setIsGroupModalOpen(true)} style={{ cursor: 'pointer' }}>
                            <h3 className={`${styles.menuText} ${isOpen ? styles.openText : ''}`}>그룹 참가하기</h3>
                        </div>
                    )}
                    {isOpen && !isLoading && !selectedGroup && (
                        <button
                            onClick={() => setIsGroupModalOpen(true)}
                            className={styles.addChannelBtn}
                            title="새 그룹 생성 또는 참여"
                        >
                            <FontAwesomeIcon icon={faPlus} />
                        </button>
                    )}
                </div>

                <div className={`${styles.groupOverlay} ${isGroupOverlayOpen ? styles.open : ''}`} onClick={() => setGroupOverlayOpen(false)}>
                    <div className={styles.timelineContainer} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.timelineConnector} />
                        <div className={styles.timeline} ref={timelineRef} onMouseLeave={() => setHoveredId(selectedGroup?.id ?? null)}>
                            {groups.map(group => {
                                const isSelected = selectedGroup?.id === group.id;
                                const isHovered = hoveredId === group.id;
                                const inviteCode = group.code;
                                return (
                                    <div
                                        key={group.id}
                                        className={`${styles.groupItem} ${isSelected ? styles.groupItemSelected : ''} ${isHovered ? styles.groupItemHovered : ''}`}
                                        onMouseEnter={() => setHoveredId(group.id)}
                                        onClick={() => handleSelectGroup(group)}
                                    >
                                        <div className={styles.itemDot} style={{ '--item-color': group.colorValue } as React.CSSProperties} />
                                        <div className={styles.itemContent}>
                                            <div className={styles.itemHeader}>
                                                <span className={styles.itemName}>{group.name}</span>
                                                {isSelected && <span className={styles.selectedBadge} style={{ '--item-color': group.colorValue } as React.CSSProperties}>Current</span>}
                                            </div>
                                            <div className={styles.itemDetails}>
                                                <div className={styles.detailText}>
                                                    <p>멤버: {group.memberCount > 0 ? `${group.memberCount}명` : 'N명'}</p>
                                                    <p>최근 활동: ...</p>
                                                </div>
                                                <div className={styles.inviteCode}>
                                                    <span>{inviteCode}</span>
                                                    <button onClick={e => { e.stopPropagation(); copyCodeToClipboard(inviteCode) }}>
                                                        <FontAwesomeIcon icon={faCopy} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            <div
                                className={`${styles.groupItem} ${styles.addGroupItem}`}
                                onMouseEnter={() => setHoveredId(0)}
                                onClick={() => { setGroupOverlayOpen(false); setIsGroupModalOpen(true); }}
                            >
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
                                <SortableContext items={groupChannels.map(c => c.id)} strategy={verticalListSortingStrategy}>
                                    <ul className={styles.optionsBarChannel}>
                                        <div className={styles.channelActiveIndicator} style={channelIndicatorStyle}></div>
                                        {groupChannels.map((channel, index) => (
                                            <SortableChannel key={channel.id} channel={channel} isOpen={isOpen} elementRef={el => { channelRefs.current[index] = el; }} />
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
                    <div
                        className={`${styles.profileLink} ${location.pathname === '/app/profile' ? styles.profileActive : ''}`}
                        onClick={() => setProfileMenuOpen(prev => !prev)}
                    >
                        <div className={styles.profileDetails}>
                            <FontAwesomeIcon icon={faUser} className={styles.profileIcon} />
                            <div className={`${styles.profileTextContainer} ${isOpen ? styles.openText : ''}`}>
                                <span className={styles.profileName}>User Name</span>
                                <span className={styles.profileRole}>Online</span>
                            </div>
                        </div>
                    </div>
                    {isProfileMenuOpen && (
                        <div className={styles.profileMenu}>
                            <Link to="/app/profile" className={styles.profileMenuItem} onClick={() => setProfileMenuOpen(false)}>
                                <FontAwesomeIcon icon={faUserEdit} />
                                <span>프로필 수정</span>
                            </Link>
                            <div
                                className={`${styles.profileMenuItem} ${styles.logoutAction}`}
                                onClick={handleLogout}
                            >
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