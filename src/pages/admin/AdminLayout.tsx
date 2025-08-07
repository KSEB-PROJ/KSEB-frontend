import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import styles from './AdminLayout.module.css';

const AdminLayout: React.FC = () => {
    return (
        <div className={styles.adminContainer}>
            <nav className={styles.sidebar}>
                <h2 className={styles.title}>관리자 페이지</h2>
                <NavLink to="/admin/dashboard" className={({ isActive }) => isActive ? styles.activeLink : styles.link}>대시보드</NavLink>
                <NavLink to="/admin/users" className={({ isActive }) => isActive ? styles.activeLink : styles.link}>사용자 관리</NavLink>
                <NavLink to="/admin/groups" className={({ isActive }) => isActive ? styles.activeLink : styles.link}>그룹 관리</NavLink>
                <NavLink to="/admin/logs" className={({ isActive }) => isActive ? styles.activeLink : styles.link}>활동 로그</NavLink>
            </nav>
            <main className={styles.content}>
                <Outlet />
            </main>
        </div>
    );
};

export default AdminLayout;