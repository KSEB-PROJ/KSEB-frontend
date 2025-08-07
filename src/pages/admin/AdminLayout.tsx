import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import styles from './AdminLayout.module.css';
import { useAuthStore } from '../../stores/authStore';
import toast from 'react-hot-toast';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSignOutAlt } from '@fortawesome/free-solid-svg-icons';

const AdminLayout: React.FC = () => {
    const navigate = useNavigate();
    const logout = useAuthStore((state) => state.logout);

    const handleLogout = () => {
        logout();
        toast.success('안전하게 로그아웃되었습니다.');
        navigate('/login');
    };

    return (
        <div className={styles.adminContainer}>
            <nav className={styles.sidebar}>
                <div>
                    <h2 className={styles.title}>관리자 페이지</h2>
                    <NavLink to="/admin/dashboard" className={({ isActive }) => isActive ? styles.activeLink : styles.link}>대시보드</NavLink>
                    <NavLink to="/admin/users" className={({ isActive }) => isActive ? styles.activeLink : styles.link}>사용자 관리</NavLink>
                    <NavLink to="/admin/groups" className={({ isActive }) => isActive ? styles.activeLink : styles.link}>그룹 관리</NavLink>
                    <NavLink to="/admin/logs" className={({ isActive }) => isActive ? styles.activeLink : styles.link}>활동 로그</NavLink>
                </div>
                <div className={styles.logoutSection}>
                    <button onClick={handleLogout} className={`${styles.link} ${styles.logoutButton}`}>
                        <FontAwesomeIcon icon={faSignOutAlt} className={styles.logoutIcon} />
                        <span>로그아웃</span>
                    </button>
                </div>
            </nav>
            <main className={styles.content}>
                <Outlet />
            </main>
        </div>
    );
};

export default AdminLayout;