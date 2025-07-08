import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './pages/AppLayout/AppLayout';
import MainPage from './pages/MainPage/MainPage';
import LoginPage from './pages/LoginForm/LoginForm';
import RegisterPage from './pages/RegisterForm/RegisterForm';
import SchedulePage from './pages/SchedulePage/SchedulePage';
import FeedbackPage from './pages/FeedbackPage/FeedbackPage';
import ProfilePage from './pages/ProfilePage/ProfilePage'; // 프로필 페이지 import

const App: React.FC = () => {
  // GSAP/Lenis 관련 코드는 유지합니다.
  // useEffect(() => { ... });

  return (
    <BrowserRouter>
      <Routes>
        {/* 로그인/회원가입/랜딩 페이지 */}
        <Route path="/" element={<MainPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* 사이드바가 포함된 메인 앱 페이지 */}
        <Route path="/app" element={<AppLayout />}>
          <Route index element={<Navigate to="home" replace />} />
          <Route path="home" element={
            <div style={{ padding: '2rem' }}><h1>Bloom Us 대시보드</h1><p>모든 기능을 한눈에 보세요.</p></div>
          } />
          <Route path="schedule" element={<SchedulePage />} />
          <Route path="feedback" element={<FeedbackPage />} />
          <Route path="profile" element={<ProfilePage />} /> {/* 프로필 페이지 라우트 추가 */}
          {/* 채널 페이지 라우팅은 추후 추가 */}
        </Route>

        {/* 잘못된 접근 리디렉션 */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;