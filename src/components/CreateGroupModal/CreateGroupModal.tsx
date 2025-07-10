/**
 * # 주요 역할
 * - 사용자가 새로운 그룹(채팅방, 팀 등)을 생성하거나
 * - 초대 코드를 입력해서 이미 만들어진 그룹에 참여할 수 있도록 해주는 모달(팝업) 컴포넌트
 *
 * # 주요 기술 및 라이브러리
 * - FontAwesome 6.x (아이콘 표시용, @fortawesome 라이브러리)
 * # 참고사항
 * - 디자인은 CSS 모듈(styles)로 분리되어 있으니 색상·레이아웃 커스텀은 해당 파일에서!
 * - onClose, onCreateGroup 등 핵심 이벤트는 부모에서 제어함
 * - 초대코드 참여 로직 등은 실제 API 연동 등 추가 개발 필요
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import styles from './CreateGroupModal.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faUsers, faHashtag, faArrowLeft } from '@fortawesome/free-solid-svg-icons';

// 모달이 받을 props의 타입 정의
// - onClose: 모달을 닫는 함수 (필수, 부모가 제공)
// - onCreateGroup: 새 그룹 생성 시 호출되는 함수 (필수, 부모가 구현)
// - initialColorName: 모달이 열릴 때 선택된 초기 색상명 (부모에서 지정)
interface Props {
    onClose: () => void;
    onCreateGroup: (groupData: { name: string; color: string; colorValue: string; }) => void;
    initialColorName: string;
}

// 그룹 생성 시 선택할 수 있는 색상 목록
// - name: 색상명(내부로 사용)
// - value: RGB 포맷(백엔드 전송 등 다양하게 활용 가능)
// - hex/hsl: UI 스타일 지정 등에서 사용
const colorOptions = [
    { name: 'purple', value: '132, 0, 255', hex: '#8400ff', hsl: '271, 100%, 50%' },
    { name: 'teal', value: '20, 214, 174', hex: '#14d6ae', hsl: '168, 85%, 46%' },
    { name: 'pink', value: '236, 72, 153', hex: '#ec4899', hsl: '330, 83%, 60%' },
    { name: 'blue', value: '59, 130, 246', hex: '#3b82f6', hsl: '217, 91%, 60%' },
    { name: 'orange', value: '249, 115, 22', hex: '#f97316', hsl: '31, 96%, 53%' },
    { name: 'green', value: '34, 197, 94', hex: '#22c55e', hsl: '145, 63%, 45%' },
    { name: 'yellow', value: '234, 179, 8', hex: '#eab308', hsl: '45, 95%, 47%' },
    { name: 'cyan', value: '6, 182, 212', hex: '#06b6d4', hsl: '189, 95%, 43%' },
    { name: 'red', value: '239, 68, 68', hex: '#ef4444', hsl: '0, 84%, 60%' },
    { name: 'indigo', value: '99, 102, 241', hex: '#6366f1', hsl: '239, 84%, 67%' },
];

// 실제 그룹 생성 모달 컴포넌트 (함수형 컴포넌트)
const CreateGroupModal: React.FC<Props> = ({ onClose, onCreateGroup, initialColorName }) => {
    // 모달 전체 영역을 참조 (배경/테마 컬러 동적 변경에 사용)
    const modalRef = useRef<HTMLDivElement>(null);

    // 모달 내 "화면" 전환 상태
    // 'select': 생성/참여 선택 화면
    // 'create': 그룹 생성 폼 화면
    // 'join': 초대코드 입력 화면
    const [view, setView] = useState('select');

    // 닫힘 애니메이션 상태 플래그
    const [isClosing, setIsClosing] = useState(false);

    // 그룹명 입력값 상태
    const [groupName, setGroupName] = useState('');

    // [초기 색상] 모달이 열릴 때 지정된 초기 색상으로 세팅 (없으면 보라색 기본값)
    const initialColor = colorOptions.find(color => color.name === initialColorName) || colorOptions[0];
    const [selectedColor, setSelectedColor] = useState(initialColor);

    // 초대코드 입력값 상태
    const [inviteCode, setInviteCode] = useState('');

    // [스타일 테마 동적 변경] 색상 선택할 때마다 CSS 변수로 테마 색상 변경
    useEffect(() => {
        if (modalRef.current) {
            // hsl: "숫자, %, %" 형태이므로 파싱해서 CSS custom property로 적용
            const [h, s, l] = selectedColor.hsl.split(',').map(str => str.trim().replace('%', ''));
            modalRef.current.style.setProperty('--theme-hue', h);
            modalRef.current.style.setProperty('--theme-saturation', s + '%');
            modalRef.current.style.setProperty('--theme-lightness', l + '%');
        }
    }, [selectedColor]);

    // [닫기 버튼, ESC 등] 모달 닫기 동작
    // - 닫기 애니메이션 후 onClose 호출
    // - useCallback: 의존성 최적화 (불필요 리렌더 방지)
    const handleClose = useCallback(() => {
        setIsClosing(true);           // 닫힘 애니메이션 활성화
        setTimeout(() => onClose(), 300); // 애니메이션 후 모달 실제로 닫기
    }, [onClose]);

    // [그룹 생성] 폼 제출 이벤트 핸들러
    // - 그룹명 입력값과 선택 색상 등 필요한 데이터 부모에게 전달
    // - 그룹명이 비어 있지 않을 때만 동작
    const handleCreateSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (groupName.trim()) {
            onCreateGroup({ name: groupName.trim(), color: selectedColor.name, colorValue: selectedColor.value });
            handleClose();
        }
    };
    
    // [초대코드 참여] 폼 제출 이벤트 핸들러
    // - 실서비스에서는 초대코드 인증/참여 기능을 추가해야 함 (지금은 alert)
    const handleJoinSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if(inviteCode.trim()){
            alert(`초대 코드 "${inviteCode}"로 그룹에 참여합니다! (실제 기능 구현 필요)`);
            handleClose();
        }
    }

    // [단축키 ESC] 모달 열려 있을 때 ESC키 누르면 닫히게 이벤트 등록/해제
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') handleClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown); // 클린업
    }, [handleClose]);

    // [모달 내 동적 컨텐츠 렌더 함수]
    // - 화면 상태(view)에 따라 각기 다른 UI를 보여줌
    // - 뒤로가기(←) 버튼도 view에 따라 표시
    const renderContent = () => {
        const showBackButton = view === 'create' || view === 'join'; // 뒤로가기 버튼 노출 조건
        return (
            <>
                {/* --- 헤더 영역: 타이틀 + 뒤로가기 버튼 --- */}
                <div className={`${styles.header} ${showBackButton ? styles.hasBackButton : ''}`}>
                    {showBackButton && (
                        <button className={styles.backButton} onClick={() => setView('select')}>
                            <FontAwesomeIcon icon={faArrowLeft} />
                        </button>
                    )}
                    <h2>
                        {view === 'create' && '새로운 그룹 생성'}
                        {view === 'join' && '초대 코드로 참여'}
                        {view === 'select' && '시작하기'}
                    </h2>
                </div>

                {/* --- 본문 영역: 선택/생성/참여 화면에 따라 달라짐 --- */}
                <div className={styles.contentContainer}>
                    {/* [그룹 만들기/참여 선택 화면] */}
                    <div className={`${styles.view} ${view === 'select' ? styles.active : ''}`}>
                        <p className={styles.description}>그룹을 만들거나, 초대코드를 입력해 참여하세요.</p>
                        <div className={styles.selectionContainer}>
                            {/* [그룹 생성 선택 카드] */}
                            <button className={styles.selectionCard} onClick={() => setView('create')}>
                                <div className={styles.cardContentWrapper}>
                                    <div className={styles.cardIcon}><FontAwesomeIcon icon={faUsers} /></div>
                                    <h3>새로운 그룹 생성</h3>
                                    <p>직접 그룹을 만들고 팀원을 초대하세요.</p>
                                </div>
                            </button>
                            {/* [초대코드 참여 카드] */}
                            <button className={styles.selectionCard} onClick={() => setView('join')}>
                                <div className={styles.cardContentWrapper}>
                                    <div className={styles.cardIcon}><FontAwesomeIcon icon={faHashtag} /></div>
                                    <h3>코드로 참여</h3>
                                    <p>이미 만들어진 그룹에 참여합니다.</p>
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* [그룹 생성 폼 화면] */}
                    <div className={`${styles.view} ${view === 'create' ? styles.active : ''}`}>
                        <form onSubmit={handleCreateSubmit} className={styles.formContent}>
                            <p className={styles.description}>그룹의 이름과 테마를 설정하세요.</p>
                            <div className={styles.inputGroup}>
                                {/* 그룹명 입력 필드 */}
                                <input type="text" id="groupName" value={groupName} onChange={(e) => setGroupName(e.target.value)} placeholder=" " required />
                                <label htmlFor="groupName">Group Name</label>
                            </div>
                            <div className={styles.inputGroup}>
                                {/* 색상 선택 필드 */}
                                <label className={styles.staticLabel}>Theme Color</label>
                                <div className={styles.colorSelector}>
                                    {/* 색상 옵션(동그라미 버튼들) */}
                                    {colorOptions.map(color => (
                                        <button
                                            type="button"
                                            key={color.name}
                                            className={`${styles.colorOrb} ${selectedColor.name === color.name ? styles.selected : ''}`}
                                            style={{ backgroundColor: color.hex }}
                                            onClick={() => setSelectedColor(color)}
                                            title={color.name}
                                        />
                                    ))}
                                </div>
                            </div>
                            <button type="submit" className={styles.submitButton}>
                                <span>Create Group</span>
                            </button>
                        </form>
                    </div>

                    {/* [초대코드 참여 폼 화면] */}
                    <div className={`${styles.view} ${view === 'join' ? styles.active : ''}`}>
                         <form onSubmit={handleJoinSubmit} className={styles.formContent}>
                            <p className={styles.description}>받은 8자리 초대 코드를 입력해 주세요.</p>
                            <div className={styles.inputGroup}>
                                <input type="text" id="inviteCode" value={inviteCode} onChange={(e) => setInviteCode(e.target.value)} placeholder=" " required />
                                <label htmlFor="inviteCode">Invite Code</label>
                            </div>
                            <button type="submit" className={styles.submitButton}>
                                <span>Join Group</span>
                            </button>
                        </form>
                    </div>
                </div>
            </>
        );
    }

    // [최상위 모달 오버레이 렌더]
    // - 배경 클릭 시 모달 닫힘
    // - 실제 모달 내용 클릭 시(e.stopPropagation()) 닫히지 않음
    // - 닫기(×) 버튼은 항상 오른쪽 위에 노출
    return (
        <div
            ref={modalRef}
            className={`${styles.modalOverlay} ${isClosing ? styles.closing : ''}`}
            onClick={handleClose}
        >
            <div
                className={`${styles.modalContent} ${isClosing ? styles.closing : ''}`}
                onClick={(e) => e.stopPropagation()}
            >
                {/* 오른쪽 상단 닫기(X) 버튼 */}
                <button onClick={handleClose} className={styles.closeButton}>
                    <FontAwesomeIcon icon={faTimes} />
                </button>
                {renderContent()}
            </div>
        </div>
    );
};

export default CreateGroupModal;
