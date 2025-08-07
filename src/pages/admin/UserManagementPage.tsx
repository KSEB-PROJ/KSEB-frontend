import React, { useEffect, useState } from 'react';
import { useAdminStore } from '../../stores/adminStore';
import styles from './UserManagementPage.module.css';
import type { UserAdmin } from '../../types/admin';

const UserManagementPage: React.FC = () => {
    const { users, userPagination, isLoading, error, fetchUsers, updateUserRoleAction, deleteUserAction } = useAdminStore();
    const [currentPage, setCurrentPage] = useState(0);
    const pageSize = 10;

    useEffect(() => {
        fetchUsers(currentPage, pageSize);
    }, [currentPage, fetchUsers]);

    const handlePageChange = (newPage: number) => {
        if (newPage >= 0 && newPage < (userPagination?.totalPages ?? 0)) {
            setCurrentPage(newPage);
        }
    };

    const handleRoleChange = (userId: number, roleName: string) => {
        // 백엔드는 "ROLE_" 접두사가 붙은 전체 키를 기대하므로, 다시 붙여서 전송
        const roleToSend = `ROLE_${roleName}` as UserAdmin['role'];
        updateUserRoleAction(userId, roleToSend);
    };

    const handleDeleteUser = (userId: number) => {
        if (window.confirm(`정말로 이 사용자를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`)) {
            deleteUserAction(userId);
        }
    };

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>사용자 관리</h1>
            {isLoading && !users.length && <div>Loading...</div>}
            {error && <div className={styles.error}>{error}</div>}
            <table className={styles.table}>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>이메일</th>
                        <th>이름</th>
                        <th>역할</th>
                        <th>가입일</th>
                        <th>관리</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map((user) => (
                        <tr key={user.id}>
                            <td>{user.id}</td>
                            <td>{user.email}</td>
                            <td>{user.name}</td>
                            <td>
                                <select
                                    // 백엔드에서 오는 값은 "USER", "ADMIN"이므로 접두사 제거
                                    value={user.role.replace('ROLE_', '')}
                                    onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                    className={styles.roleSelect}
                                >
                                    <option value="USER">USER</option>
                                    <option value="ADMIN">ADMIN</option>
                                </select>
                            </td>
                            <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                            <td>
                                <button
                                    onClick={() => handleDeleteUser(user.id)}
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
                    페이지 {currentPage + 1} / {userPagination?.totalPages ?? 1}
                </span>
                <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage >= (userPagination?.totalPages ?? 1) - 1}>
                    다음
                </button>
            </div>
        </div>
    );
};

export default UserManagementPage;