import React, { useEffect, useState } from 'react';
import { useAdminStore } from '../../stores/adminStore';
import styles from './GroupManagementPage.module.css';

const GroupManagementPage: React.FC = () => {
    const { groups, groupPagination, isLoading, error, fetchGroups, deleteGroupAction } = useAdminStore();
    const [currentPage, setCurrentPage] = useState(0);
    const pageSize = 10;

    useEffect(() => {
        fetchGroups(currentPage, pageSize);
    }, [currentPage, fetchGroups]);

    const handlePageChange = (newPage: number) => {
        if (newPage >= 0 && newPage < (groupPagination?.totalPages ?? 0)) {
            setCurrentPage(newPage);
        }
    };

    const handleDeleteGroup = (groupId: number) => {
        if (window.confirm(`정말로 이 그룹을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`)) {
            deleteGroupAction(groupId);
        }
    };

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>그룹 관리</h1>
            {isLoading && !groups.length && <div>Loading...</div>}
            {error && <div className={styles.error}>{error}</div>}
            <table className={styles.table}>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>그룹명</th>
                        <th>생성자</th>
                        <th>멤버 수</th>
                        <th>생성일</th>
                        <th>관리</th>
                    </tr>
                </thead>
                <tbody>
                    {groups.map((group) => (
                        <tr key={group.id}>
                            <td>{group.id}</td>
                            <td>{group.name}</td>
                            <td>{group.createdBy}</td>
                            <td>{group.memberCount}</td>
                            <td>{new Date(group.createdAt).toLocaleDateString()}</td>
                            <td>
                                <button
                                    onClick={() => handleDeleteGroup(group.id)}
                                    className={`${styles.actionButton} ${styles.deleteButton}`}
                                >
                                    삭제
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <div className={styles.pagination}>
                <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 0}>
                    이전
                </button>
                <span>
                    페이지 {currentPage + 1} / {groupPagination?.totalPages ?? 1}
                </span>
                <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage >= (groupPagination?.totalPages ?? 1) - 1}>
                    다음
                </button>
            </div>
        </div>
    );
};

export default GroupManagementPage;
