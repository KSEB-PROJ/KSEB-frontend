/**
 * @file CreateChannelModal.tsx
 * @description 새롭게 디자인된 채널 생성 모달 컴포넌트입니다.
 * - 세련된 UI와 애니메이션을 적용하여 사용자 경험을 향상시켰습니다.
 * - FontAwesome 아이콘을 추가하여 시각적 인지를 돕습니다.
 * - 기존의 기능(onClose, onCreate)은 그대로 유지하며 재사용성을 높였습니다.
 */
import React, { useState, useEffect, useCallback } from 'react';
import styles from './CreateChannelModal.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faHashtag, faArrowRight } from '@fortawesome/free-solid-svg-icons';

interface Props {
    /** 모달을 닫을 때 호출되는 콜백 함수 */
    onClose: () => void;
    /** 새 채널 이름을 전달하여 생성 처리하는 콜백 함수 */
    onCreate: (channelName: string) => void;
}

const CreateChannelModal: React.FC<Props> = ({ onClose, onCreate }) => {
    // 사용자가 입력한 채널 이름 상태 관리
    const [channelName, setChannelName] = useState('');
    // 닫힘 애니메이션을 위한 상태
    const [isClosing, setIsClosing] = useState(false);

    /**
     * 모달 닫기 핸들러 (애니메이션 포함)
     */
    const handleClose = useCallback(() => {
        setIsClosing(true);
        setTimeout(() => onClose(), 300); // 애니메이션 시간(0.3s) 후 onClose 호출
    }, [onClose]);

    /**
     * 폼 제출 핸들러
     */
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = channelName.trim();
        if (trimmed) {
            onCreate(trimmed);
        }
    };

    /**
     * ESC 키 입력 시 모달 닫기
     */
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                handleClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [handleClose]);

    return (
        <div
            className={`${styles.modalOverlay} ${isClosing ? styles.closing : ''}`}
            onClick={handleClose}
        >
            <div
                className={`${styles.modalContent} ${isClosing ? styles.closing : ''}`}
                onClick={(e) => e.stopPropagation()}
            >
                {/* 오른쪽 상단 닫기 버튼 */}
                <button onClick={handleClose} className={styles.closeButton}>
                    <FontAwesomeIcon icon={faTimes} />
                </button>

                {/* 헤더: 아이콘, 제목, 설명 */}
                <div className={styles.modalHeader}>
                    <div className={styles.headerIcon}>
                        <FontAwesomeIcon icon={faHashtag} />
                    </div>
                    <h2>새로운 채널 생성</h2>
                    <p>팀원들과 아이디어를 나눌 공간의 이름을 정해주세요.</p>
                </div>

                {/* 채널 생성 폼 */}
                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.inputGroup}>
                        <input
                            type="text"
                            id="channelName"
                            value={channelName}
                            onChange={(e) => setChannelName(e.target.value)}
                            className={styles.input}
                            autoFocus
                            // placeholder는 비워야함.
                            placeholder=" "
                        />
                        <label htmlFor="channelName" className={styles.label}>채널 이름</label>
                    </div>

                    <button type="submit" className={styles.createButton} disabled={!channelName.trim()}>
                        <span>채널 만들기</span>
                        <FontAwesomeIcon icon={faArrowRight} />
                    </button>
                </form>
            </div>
        </div>
    );
};

export default CreateChannelModal;