import React from 'react';
import styles from './ProfilePage.module.css';

const ProfilePage: React.FC = () => {
    return (
        <div className={styles.container}>
            <h1 className={styles.title}>프로필 수정</h1>
            <p className={styles.description}>이곳에서 사용자 정보를 수정할 수 있습니다.</p>
            {/* 프로필 수정 폼 추가 예정. */}
        </div>
    );
};

export default ProfilePage;