import React, { useEffect } from 'react';
import { useAdminStore } from '../../stores/adminStore';
import styles from './DashboardPage.module.css';
import LineChart from './charts/LineChart';
import BarChart from './charts/BarChart';
import DoughnutChart from './charts/DoughnutChart';
import { FaUsers, FaUserPlus, FaLayerGroup, FaComments, FaBullhorn, FaCalendarAlt } from 'react-icons/fa';

const DashboardPage: React.FC = () => {
    const { 
        dashboardData, 
        dailyRegistrations,
        hourlyActivity,
        contentTypeDistribution,
        logs,
        isLoading, 
        error, 
        fetchDashboardData,
        fetchStats,
        fetchLogs
    } = useAdminStore();

    useEffect(() => {
        fetchDashboardData();
        fetchStats();
        fetchLogs({ page: 0, size: 5 });
    }, [fetchDashboardData, fetchStats, fetchLogs]);

    if (isLoading && !dashboardData) {
        return <div className={styles.dashboardContainer}>Loading...</div>;
    }

    if (error) {
        return <div className={styles.error}>{error}</div>;
    }

    return (
        <div className={styles.dashboardContainer}>
            <h1 className={styles.title}>대시보드</h1>
            
            <div className={styles.cardGrid}>
                <div className={styles.card}>
                    <FaUsers className={styles.cardIcon} style={{ color: '#3498db' }} />
                    <div className={styles.cardContent}>
                        <h2 className={styles.cardTitle}>총 사용자 수</h2>
                        <p className={styles.cardValue}>{dashboardData?.totalUsers ?? 'N/A'}</p>
                    </div>
                </div>
                <div className={styles.card}>
                    <FaUserPlus className={styles.cardIcon} style={{ color: '#2ecc71' }} />
                    <div className={styles.cardContent}>
                        <h2 className={styles.cardTitle}>오늘 가입한 사용자</h2>
                        <p className={styles.cardValue}>{dashboardData?.todayRegisteredUsers ?? 'N/A'}</p>
                    </div>
                </div>
                <div className={styles.card}>
                    <FaLayerGroup className={styles.cardIcon} style={{ color: '#9b59b6' }} />
                    <div className={styles.cardContent}>
                        <h2 className={styles.cardTitle}>총 그룹 수</h2>
                        <p className={styles.cardValue}>{dashboardData?.totalGroups ?? 'N/A'}</p>
                    </div>
                </div>
                <div className={styles.card}>
                    <FaComments className={styles.cardIcon} style={{ color: '#34495e' }} />
                    <div className={styles.cardContent}>
                        <h2 className={styles.cardTitle}>총 채널 수</h2>
                        <p className={styles.cardValue}>{contentTypeDistribution?.channelCount ?? 'N/A'}</p>
                    </div>
                </div>
                <div className={styles.card}>
                    <FaBullhorn className={styles.cardIcon} style={{ color: '#f1c40f' }} />
                    <div className={styles.cardContent}>
                        <h2 className={styles.cardTitle}>총 공지 수</h2>
                        <p className={styles.cardValue}>{contentTypeDistribution?.noticeCount ?? 'N/A'}</p>
                    </div>
                </div>
                <div className={styles.card}>
                    <FaCalendarAlt className={styles.cardIcon} style={{ color: '#e74c3c' }} />
                    <div className={styles.cardContent}>
                        <h2 className={styles.cardTitle}>총 일정 수</h2>
                        <p className={styles.cardValue}>{contentTypeDistribution?.eventCount ?? 'N/A'}</p>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className={styles.contentGrid}>
                {/* Main Column */}
                <div className={styles.mainColumn}>
                    <div className={styles.chartWrapper}>
                        <LineChart data={dailyRegistrations} title="최근 7일간 가입자 수" />
                    </div>
                    <div className={styles.chartWrapper}>
                        <BarChart data={hourlyActivity} title="최근 24시간 활동량 (메시지 기준)" />
                    </div>
                </div>
                {/* Side Column */}
                <div className={styles.sideColumn}>
                    <div className={styles.chartWrapper}>
                        <DoughnutChart data={contentTypeDistribution} title="콘텐츠 생성 비율" />
                    </div>
                    <div className={styles.logContainer}>
                        <h2 className={styles.sectionTitle}>최근 활동 로그</h2>
                        <table className={styles.logTable}>
                            <thead>
                                <tr>
                                    <th>수행자</th>
                                    <th>활동 내용</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.map((log) => (
                                    <tr key={log.id}>
                                        <td>{log.actorName}</td>
                                        <td>{log.actionDescription}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;