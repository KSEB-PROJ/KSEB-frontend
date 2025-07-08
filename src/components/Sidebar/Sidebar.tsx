//  사이드바 영역.
// 주요 기능:
// - 그룹(예: 팀) 선택 드롭다운
// - 메인 네비게이션 메뉴
// - 드래그 앤 드롭으로 정렬 가능한 채널 목록
// - 사용자 프로필 링크
// 사용 라이브러리:
// - react, react-router-dom: 컴포넌트/라우팅
// - FontAwesome: 아이콘
// - @dnd-kit: 드래그 앤 드롭
// - CSS Modules: 스타일링

import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import styles from './Sidebar.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { type IconDefinition, faBars, faHome, faCalendarAlt, faCommentDots, faVideo, faBullhorn, faChevronRight, faUsers, faPlus, faChevronDown, faUser, faRobot, faGripVertical } from '@fortawesome/free-solid-svg-icons';

import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import CreateChannelModal from '../CreateChannelModal/CreateChannelModal';

// 메뉴 아이템이 링크를 가지는 경우 (NavLink 사용)
type MenuItemLink = {
    path: string;            // 이동할 라우트 경로
    id?: undefined;
    icon: IconDefinition;    // FontAwesome 아이콘
    text: string;            // 화면에 표시할 텍스트
};

// 메뉴 아이템이 액션을 가지는 경우 (onClick 토글)
type MenuItemAction = {
    id: string;              // 고유 ID (NavLink 대신 사용)
    path?: undefined;
    icon: IconDefinition;
    text: string;
};

type MenuItem = MenuItemLink | MenuItemAction;

// 상단에 표시할 메인 메뉴 목록 정의
const mainMenuItems: MenuItem[] = [
    { path: '/app/home', icon: faHome, text: '홈' },
    { path: '/app/schedule', icon: faCalendarAlt, text: '개인 스케줄 입력' },
    { path: '/app/feedback', icon: faVideo, text: '발표 피드백' },
    { id: 'chatbot', icon: faRobot, text: '챗봇' },
];

// 채널(하위 메뉴) 데이터 구조 정의
interface Channel {
    id: string;
    name: string;
    type: 'notice' | 'calendar' | 'chat';
    isDraggable: boolean;    // 드래그 가능 여부
}

// 그룹(팀) 데이터 구조 정의
interface Group {
    id: number;
    name: string;
}

// 드래그 앤 드롭 가능한 채널 항목 컴포넌트
const SortableChannel = ({ channel, isOpen }: { channel: Channel; isOpen: boolean }) => {
    // useSortable 훅으로 드래그 상태 및 속성 얻기
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: channel.id,
        disabled: !channel.isDraggable, // 비활성화된 채널은 드래그 비허용
    });

    // 드래그 중 스타일 지정
    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 1 : 0,
        backgroundColor: isDragging ? 'rgba(132, 0, 255, 0.7)' : 'transparent',
        borderRadius: isDragging ? '.5rem' : '0',
    };

    return (
        <li
            ref={setNodeRef}
            style={style}
            {...attributes}
            className={`${styles.channelItem} ${channel.isDraggable && isOpen ? styles.draggableItem : ''}`}
        >
            <a href="#" className={styles.channelLink}>
                {/* 드래그 핸들러 아이콘 */}
                <div {...listeners} className={styles.dragHandle}>
                    <FontAwesomeIcon icon={faGripVertical} />
                </div>
                {/* 채널 아이콘 및 이름 표시 영역 */}
                <div className={styles.channelContent}>
                    <FontAwesomeIcon
                        icon={
                            channel.type === 'notice' ? faBullhorn :
                                channel.type === 'calendar' ? faCalendarAlt :
                                    faCommentDots
                        }
                        className={styles.icon}
                    />
                    <h5 className={`${styles.menuText} ${isOpen ? styles.openText : ''}`}>{channel.name}</h5>
                </div>
            </a>
        </li>
    );
};

// 실제 사용할 그룹 목록
const groups: Group[] = [
    { id: 1, name: 'Bloom Us 개발팀' },
    { id: 2, name: '캡스톤 디자인' },
];

// 그룹별 초기 채널 데이터
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

// Sidebar 컴포넌트 Props 정의
interface SidebarProps {
    isOpen: boolean;            // 사이드바 열림 상태
    onToggle: () => void;       // 열림/닫힘 토글 함수
    onChatbotToggle: () => void;// 챗봇 메뉴 클릭 핸들러
    isChatbotOpen: boolean;     // 챗봇 메뉴 활성 상태
}

// Sidebar 컴포넌트 본체
const Sidebar: React.FC<SidebarProps> = ({ isOpen, onToggle, onChatbotToggle, isChatbotOpen }) => {
    const location = useLocation();

    // 선택된 그룹 상태 및 해당 그룹의 채널 목록 상태
    const [selectedGroup, setSelectedGroup] = useState<Group>(groups[0]);
    const [groupChannels, setGroupChannels] = useState<Channel[]>(initialChannels[selectedGroup.id]);
    const [isGroupDropdownOpen, setGroupDropdownOpen] = useState(false);

    // 새 채널 생성 모달 오픈 상태
    const [isModalOpen, setIsModalOpen] = useState(false);

    // 현재 활성 메뉴 하이라이트(인디케이터) 스타일 (top, height, opacity)
    const [indicatorStyle, setIndicatorStyle] = useState({ top: 0, height: 0, opacity: 0 });

    // 메뉴 항목 요소 참조를 저장할 배열
    const menuRefs = useRef<(HTMLLIElement | null)[]>([]);
    const optionsContainerRef = useRef<HTMLUListElement>(null);
    const sidebarRef = useRef<HTMLElement>(null);

    // 그룹 변경 시 채널 목록 초기화
    useEffect(() => {
        setGroupChannels(initialChannels[selectedGroup.id] || []);
    }, [selectedGroup]);

    // 현재 URL 경로에 맞춰 active 메뉴 인디케이터 위치 업데이트
    useEffect(() => {
        let activeEl: HTMLElement | null = null;
        const index = mainMenuItems.findIndex(item => item.path && item.path === location.pathname);
        if (index > -1) activeEl = menuRefs.current[index];

        if (activeEl && optionsContainerRef.current) {
            const top = activeEl.offsetTop;
            setIndicatorStyle({ top, height: activeEl.offsetHeight, opacity: 1 });
        } else {
            setIndicatorStyle(prev => ({ ...prev, opacity: 0 }));
        }
    }, [location.pathname, isOpen]);

    // 드래그 종료 시 순서 변경 처리
    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const activeItem = groupChannels.find(c => c.id === active.id);
            const overItem = groupChannels.find(c => c.id === over.id);
            // 비허용 드래그 항목 무시
            if (!activeItem?.isDraggable || !overItem?.isDraggable) return;

            // 배열 순서 변경
            setGroupChannels(channels => {
                const oldIndex = channels.findIndex(c => c.id === active.id);
                const newIndex = channels.findIndex(c => c.id === over.id);
                return arrayMove(channels, oldIndex, newIndex);
            });
        }
    };

    // 새 채널 생성 로직
    const handleCreateChannel = (channelName: string) => {
        const newChannel: Channel = {
            id: `chat-${Date.now()}`,
            name: channelName,
            type: 'chat',
            isDraggable: true,
        };
        const updated = [...groupChannels, newChannel];
        setGroupChannels(updated);
        initialChannels[selectedGroup.id] = updated;
        setIsModalOpen(false);
    };

    // 그룹 드롭다운 토글 및 선택
    const toggleGroupDropdown = () => setGroupDropdownOpen(!isGroupDropdownOpen);
    const handleSelectGroup = (group: Group) => { setSelectedGroup(group); setGroupDropdownOpen(false); };

    // DnD 센서 설정 (포인터, 최소 이동 거리 5px)
    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

    return (
        <>
            {/* 채널 생성 모달 */}
            {isModalOpen && <CreateChannelModal onClose={() => setIsModalOpen(false)} onCreate={handleCreateChannel} />}

            {/* 사이드바 네비게이션 */}
            <nav ref={sidebarRef} className={`${styles.menu} ${isOpen ? styles.open : ''}`}>
                {/* 그룹 선택 및 메뉴 토글 바 */}
                <div className={styles.actionBar}>
                    <div className={styles.groupSelector}>
                        {/* 햄버거 버튼: 사이드바 열기/닫기 */}
                        <button onClick={onToggle} className={styles.menuBtn}>
                            <FontAwesomeIcon icon={faBars} />
                        </button>
                        {/* 현재 선택된 그룹명 및 드롭다운 아이콘 */}
                        <div className={styles.groupDisplay} onClick={toggleGroupDropdown}>
                            <h3 className={`${styles.menuText} ${isOpen ? styles.openText : ''}`}>{selectedGroup.name}</h3>
                            <FontAwesomeIcon icon={isGroupDropdownOpen ? faChevronDown : faChevronRight} className={`${styles.menuText} ${isOpen ? styles.openText : ''}`} />
                        </div>
                    </div>

                    {/* 그룹 드롭다운 메뉴: 그룹 리스트 + 그룹 생성/참여 버튼 */}
                    {isGroupDropdownOpen && isOpen && (
                        <div className={styles.groupDropdown}>
                            {groups.map(group => (
                                <div key={group.id} className={styles.groupItem} onClick={() => handleSelectGroup(group)}>
                                    <FontAwesomeIcon icon={faUsers} />
                                    <span>{group.name}</span>
                                </div>
                            ))}
                            <div className={styles.groupItem}>
                                <FontAwesomeIcon icon={faPlus} />
                                <span>그룹 만들기/참여</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* 메인 메뉴 리스트 */}
                <ul ref={optionsContainerRef} className={styles.optionsBar}>
                    {/* 활성 메뉴를 표시하는 인디케이터 */}
                    <div className={styles.activeIndicator} style={indicatorStyle}></div>
                    {mainMenuItems.map((item, index) => (
                        <li key={item.path || item.id} className={styles.menuItem} ref={el => { menuRefs.current[index] = el; }}>
                            {item.path ? (
                                // 라우트 링크 메뉴
                                <NavLink to={item.path} className={({ isActive }) => `${styles.menuOption} ${isActive ? styles.textActive : ''}`}>
                                    <FontAwesomeIcon icon={item.icon} className={styles.icon} />
                                    <h5 className={`${styles.menuText} ${isOpen ? styles.openText : ''}`}>{item.text}</h5>
                                </NavLink>
                            ) : (
                                // 액션 메뉴 (챗봇 토글)
                                <div onClick={onChatbotToggle} className={`${styles.menuOption} ${isChatbotOpen ? styles.chatbotActive : ''}`}>
                                    <FontAwesomeIcon icon={item.icon} className={styles.icon} />
                                    <h5 className={`${styles.menuText} ${isOpen ? styles.openText : ''}`}>{item.text}</h5>
                                </div>
                            )}
                        </li>
                    ))}
                </ul>

                {/* 메뉴 구분선 */}
                <div className={styles.menuBreak}><hr /></div>

                {/* 채널 섹션: 채널 헤더 + DnD 가능 리스트 */}
                <div className={styles.channelSection}>
                    <div className={styles.channelHeader}>
                        <h4 className={`${styles.menuText} ${isOpen ? styles.openText : ''}`}>채널</h4>
                        {/* 채널 추가 버튼 */}
                        {isOpen && (
                            <button onClick={() => setIsModalOpen(true)} className={styles.addChannelBtn}>
                                <FontAwesomeIcon icon={faPlus} />
                            </button>
                        )}
                    </div>
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                        <SortableContext items={groupChannels.map(c => c.id)} strategy={verticalListSortingStrategy}>
                            <ul className={styles.optionsBarChannel}>
                                {groupChannels.map(channel => (
                                    <SortableChannel key={channel.id} channel={channel} isOpen={isOpen} />
                                ))}
                            </ul>
                        </SortableContext>
                    </DndContext>
                </div>

                {/* 프로필 섹션: 프로필 링크 및 상태 */}
                <div className={styles.profileSection}>
                    <NavLink to="/app/profile" className={({ isActive }) => `${styles.profileLink} ${isActive ? styles.profileActive : ''}`}>
                        <div className={styles.profileDetails}>
                            <FontAwesomeIcon icon={faUser} className={styles.profileIcon} />
                            <div className={`${styles.profileTextContainer} ${isOpen ? styles.openText : ''}`}>
                                <span className={styles.profileName}>User Name</span>
                                <span className={styles.profileRole}>Edit Profile</span>
                            </div>
                        </div>
                        <FontAwesomeIcon icon={faChevronRight} className={`${styles.profileArrow} ${isOpen ? styles.openText : ''}`} />
                    </NavLink>
                </div>
            </nav>
        </>
    );
};

export default Sidebar;
