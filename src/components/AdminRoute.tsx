import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

const AdminRoute: React.FC = () => {
    const { isLoggedIn, user } = useAuthStore();

    // 로그인 상태가 아니고, 스토어에서 사용자 정보 로딩이 아직 안됐을 수 있으므로 잠시 대기
    // persist된 스토어가 로드되기 전에 user가 null일 수 있음
    if (!isLoggedIn && !user) {
        // 로그인 페이지로 보내거나, 상태에 따라 로딩 스피너를 보여줄 수 있음
        return <Navigate to="/login" replace />;
    }
    
    // user 정보가 로드될 때까지 잠시 기다림
    if (!user) {
        return <div>Loading...</div>; // 혹은 null
    }

    // 사용자 역할이 ADMIN이 아니면 접근 거부
    if (user.role !== 'ROLE_ADMIN') {
        // ADMIN이 아닌 사용자는 메인 페이지로 리다이렉트
        return <Navigate to="/" replace />;
    }

    // 모든 조건을 통과하면 관리자 페이지를 보여줌
    return <Outlet />;
};

export default AdminRoute;
