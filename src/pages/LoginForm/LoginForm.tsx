// src/pages/LoginForm.tsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // 페이지 이동(네비게이션)을 위한 훅 import
import styles from './LoginForm.module.css';   // CSS 모듈 import (컴포넌트 전용 스타일 적용)
import { Link } from 'react-router-dom';

// ※ 'boxicons' 아이콘 사용을 위해서는 public/index.html <head>에 CDN 링크 필요!
// 예: <link rel='stylesheet' href='https://unpkg.com/boxicons@2.1.4/css/boxicons.min.css'>

const LoginForm: React.FC = () => {
    // 사용자 입력 상태값 선언 (입력창 제어)
    const [username, setUsername] = useState('');       // 사용자명
    const [password, setPassword] = useState('');       // 비밀번호
    const [showPassword, setShowPassword] = useState(false); // 비밀번호 표시 여부(토글)
    const navigate = useNavigate(); // 리액트 라우터의 페이지 이동 함수

    /*
     * 로그인 폼 제출 이벤트 핸들러
     * - 기본 제출 동작 방지
     * - 아이디/비번이 정해진 값과 일치하면 '로그인 성공' 후 /main 페이지로 이동
     * - 아니면 경고창
     */
    const handleLogin = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault(); // 페이지 새로고침 방지
        if (username === "Ajmal" && password === 'Ajmal07') {
            alert('Successfully Verified'); // 성공 알림
            navigate('/app'); // 메인페이지(랜딩/대시보드 등)로 이동
        } else {
            alert('Enter Your Details');    // 실패 알림
        }
    };

    /**
     * 비밀번호 보이기/숨기기 토글 함수
     * - showPassword 상태값을 반전시켜 input type을 text/password로 전환
     */
    const togglePasswordVisibility = () => {
        setShowPassword(prev => !prev);
    };

    return (
        <div className={styles.wrapper}>
            {/* 로그인 폼 전체를 감싸는 컨테이너 (중앙 정렬/배경 등 적용) */}
            <div className={styles.loginBox}>
                {/* 상단 타이틀 (Login) */}
                <div className={styles.loginHeader}>
                    <span>Login</span>
                </div>
                {/* 실제 로그인 입력/제출 폼 */}
                <form onSubmit={handleLogin}>
                    {/* 사용자명 입력 영역 */}
                    <div className={styles.inputBox}>
                        {/* 텍스트 입력 필드 (사용자명) */}
                        <input
                            type="text"
                            id="user"
                            className={styles.inputField}
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                        {/* 입력란 라벨 (floating label 효과, 스타일로 제어) */}
                        <label htmlFor="user" className={styles.label}>
                            Username
                        </label>
                        {/* 사용자 아이콘 (boxicons 아이콘 사용) */}
                        <i className={`bx bx-user ${styles.icon}`}></i>
                    </div>

                    {/* 비밀번호 입력 영역 */}
                    <div className={styles.inputBox}>
                        {/* 비밀번호 입력 필드 (보이기/숨기기 토글 지원) */}
                        <input
                            type={showPassword ? "text" : "password"} // 보이기 여부에 따라 type 전환
                            id="pass"
                            className={styles.inputField}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                        {/* 입력란 라벨 */}
                        <label htmlFor="pass" className={styles.label}>
                            Password
                        </label>
                        {/* 자물쇠 아이콘 (클릭하면 비밀번호 보이기/숨기기) */}
                        <i
                            className={`bx bx-lock-alt ${styles.icon}`}
                            onClick={togglePasswordVisibility}
                            style={{ cursor: "pointer" }}
                            title={showPassword ? "Hide password" : "Show password"}
                        ></i>
                    </div>

                    {/* 'Remember me' 체크박스 및 'Forgot password' 링크 */}
                    <div className={styles.rememberForgot}>
                        {/* 체크박스(자동로그인 등 용도) */}
                        <div className={styles.rememberMe}>
                            <input type="checkbox" id="remember" />
                            <label htmlFor="remember">Remember me</label>
                        </div>
                        {/* 비밀번호 찾기 (링크, 실제 구현 X) */}
                        <div className={styles.forgot}>
                            <a href="#">Forgot password</a>
                        </div>
                    </div>

                    {/* 로그인 제출 버튼 */}
                    <div className={styles.inputBox}>
                        <input type="submit" className={styles.inputSubmit} value="Login" />
                    </div>

                    {/* 회원가입 안내 (아직 계정 없으면) */}
                    <div className={styles.register}>
                        <span>
                            Don't have an account? <Link to="/register">Register</Link>
                        </span>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default LoginForm;