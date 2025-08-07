import React, { useEffect } from 'react';
import { useAdminStore } from '../../stores/adminStore';
import styles from './DashboardPage.module.css';

const DashboardPage: React.FC = () => {
    const { dashboardData, isLoading, error, fetchDashboardData } = useAdminStore();

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    if (isLoading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div className={styles.error}>{error}</div>;
    }

    return (
        <div className={styles.dashboardContainer}>
            <h1 className={styles.title}>대시보드</h1>
            <div className={styles.cardGrid}>
                <div className={styles.card}>
                    <h2 className={styles.cardTitle}>총 사용자 수</h2>
                    <p className={styles.cardValue}>{dashboardData?.totalUsers ?? 'N/A'}</p>
                </div>
                <div className={styles.card}>
                    <h2 className={styles.cardTitle}>오늘 가입한 사용자</h2>
                    <p className={styles.cardValue}>{dashboardData?.todayRegisteredUsers ?? 'N/A'}</p>
                </div>
                <div className={styles.card}>
                    <h2 className={styles.cardTitle}>총 그룹 수</h2>
                    <p className={styles.cardValue}>{dashboardData?.totalGroups ?? 'N/A'}</p>
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;