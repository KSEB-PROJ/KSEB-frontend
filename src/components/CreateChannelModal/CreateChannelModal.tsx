 /**
 * CreateChannelModal 컴포넌트
 *
 * 사용자가 새로운 채팅 채널을 생성할 수 있는 모달
 * - ESC 키 또는 오버레이 클릭 시 모달 닫기(onClose)
 * - 폼 제출 시 입력한 채널 이름(onCreate)을 부모로 전달
 * - 이벤트 전파 방지(stopPropagation)로 불필요한 닫기 방지
 *
 * 사용된 기술 스택:
 * - React: 함수형 컴포넌트, useState, useEffect 훅
 * - TypeScript: Props 및 이벤트 타입 정의
 * - CSS Modules: 스타일 모듈 (CreateChannelModal.module.css)
 */
import React, { useState, useEffect } from 'react';
import styles from './CreateChannelModal.module.css';

interface Props {
    /** 모달을 닫을 때 호출되는 콜백 함수 */
    onClose: () => void;
    /** 새 채널 이름을 전달하여 생성 처리하는 콜백 함수 */
    onCreate: (channelName: string) => void;
}

const CreateChannelModal: React.FC<Props> = ({ onClose, onCreate }) => {
    // 사용자가 입력한 채널 이름 상태 관리
    const [channelName, setChannelName] = useState('');

    /**
     * 폼 제출 핸들러
     * - 기본 이벤트 방지
     * - 공백 제거 후 onCreate 호출
     */
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = channelName.trim();
        if (trimmed) {
            onCreate(trimmed);
        }
    };

    /**
     * ESC 키 입력 시 모달 닫기 기능
     * - 컴포넌트 마운트 시 이벤트 리스너 등록
     * - 언마운트 시 해제
     */
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [onClose]);

    return (
        /** 전체 화면 오버레이: 클릭 시 모달 닫기 */
        <div className={styles.modalOverlay} onClick={onClose}>
            {/* 오버레이 클릭 전파 차단: 모달 내부 클릭 시 닫기 방지 */}
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                {/* 헤더: 제목 및 설명 */}
                <div className={styles.modalHeader}>
                    <h2>새로운 채널 생성</h2>
                    <p>팀원들과 소통할 채널의 이름을 입력하세요.</p>
                </div>

                {/* 채널 생성 폼 */}
                <form onSubmit={handleSubmit} className={styles.form}>
                    {/* 채널 이름 입력 필드 */}
                    <input
                        type="text"
                        value={channelName}
                        onChange={(e) => setChannelName(e.target.value)}
                        placeholder="예: 프론트엔드 이야기"
                        className={styles.input}
                        autoFocus
                    />

                    {/* 버튼 그룹: 취소 및 생성 */}
                    <div className={styles.buttonGroup}>
                        {/* 취소 버튼: 클릭 시 onClose 호출 */}
                        <button type="button" onClick={onClose} className={styles.button}>
                            취소
                        </button>
                        {/* 생성 버튼: 폼 제출 트리거 */}
                        <button type="submit" className={`${styles.button} ${styles.createButton}`}>
                            생성
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateChannelModal;
