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

    const handleRoleChange = (userId: number, role: UserAdmin['role']) => {
        updateUserRoleAction(userId, role);
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
                                    value={user.role}
                                    onChange={(e) => handleRoleChange(user.id, e.target.value as UserAdmin['role'])}
                                    className={styles.roleSelect}
                                >
                                    <option value="ROLE_USER">USER</option>
                                    <option value="ROLE_ADMIN">ADMIN</option>
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
