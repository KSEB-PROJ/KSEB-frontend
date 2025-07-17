import React from 'react';
import styles from './ChannelPage.module.css';

const CalendarPage: React.FC = () => {
    return (
        <div className={styles.channelContent}>
            <p>이곳에 그룹 캘린더 라이브러리가 표시됩니다. (예: FullCalendar)</p>
            {/* 향후 캘린더 구현 영역 */}
        </div>
    );
};

export default CalendarPage;