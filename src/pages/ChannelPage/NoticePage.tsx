import React from 'react';
import styles from './ChannelPage.module.css';

const NoticePage: React.FC = () => {
    return (
        <div className={styles.channelContent}>
            {/* 예시 공지사항 아이템 */}
            <div className={styles.noticeItem}>
                <h3>[필독] 캡스톤 디자인 최종 발표 안내</h3>
                <p className={styles.noticeMeta}>작성자: 관리자 | 날짜: 2025-07-15</p>
                <p>안녕하세요. 캡스톤 디자인 최종 발표 일정을 공유합니다. 모두 필참해주시기 바랍니다.</p>
            </div>
            <div className={styles.noticeItem}>
                <h3>중간 발표 피드백 정리</h3>
                <p className={styles.noticeMeta}>작성자: 김세현 | 날짜: 2025-07-10</p>
                <p>교수님께서 주신 피드백을 정리하여 올립니다. 다음 회의 전까지 꼭 확인해주세요.</p>
            </div>
        </div>
    );
};

export default NoticePage;