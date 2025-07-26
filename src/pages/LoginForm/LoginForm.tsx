/**
 * @file LoginForm.tsx
 * @description Zustand 스토어를 사용하여 리팩토링된 로그인 폼 컴포넌트입니다.
 * - API 호출, 토큰 저장, 사용자 정보 조회, toast 알림 등의 로직을 모두 authStore에 위임합니다.
 * - 컴포넌트는 사용자 입력을 받고, 스토어의 login 액션을 호출하는 역할만 수행합니다.
 */

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import styles from './LoginForm.module.css';
import { useAuthStore } from '../../stores/authStore';

const LoginForm: React.FC = () => {
    // UI 상태 (사용자 입력)
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    // 페이지 이동 함수
    const navigate = useNavigate();
    
    // authStore에서 login 액션만 가져옵니다.
    const { login } = useAuthStore();

    /**
     * [수정] 로그인 폼 제출 핸들러
     * - 스토어의 login 액션을 호출하고, 결과에 따라 페이지를 이동시킵니다.
     */
    const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault(); // 페이지 새로고침 방지

        // 스토어의 login 액션에 이메일과 비밀번호를 전달하여 호출
        const success = await login({ email, password });

        // 스토어에서 반환된 결과가 true(성공)일 경우에만 페이지 이동
        if (success) {
            navigate('/app');
        }
    };

    const togglePasswordVisibility = () => {
        setShowPassword(prev => !prev);
    };

    // (이하 JSX 구조는 이전과 동일)
    return (
        <div className={styles.wrapper}>
            <div className={styles.loginBox}>
                <div className={styles.loginHeader}>
                    <span>Login</span>
                </div>
                <form onSubmit={handleLogin}>
                    <div className={styles.inputBox}>
                        <input
                            type="email"
                            id="email"
                            className={styles.inputField}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                        <label htmlFor="email" className={styles.label}>
                            Email Address
                        </label>
                        <i className={`bx bx-envelope ${styles.icon}`}></i>
                    </div>

                    <div className={styles.inputBox}>
                        <input
                            type={showPassword ? "text" : "password"}
                            id="pass"
                            className={styles.inputField}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                        <label htmlFor="pass" className={styles.label}>
                            Password
                        </label>
                        <i
                            className={`bx bx-lock-alt ${styles.icon}`}
                            onClick={togglePasswordVisibility}
                            style={{ cursor: "pointer" }}
                            title={showPassword ? "Hide password" : "Show password"}
                        ></i>
                    </div>

                    <div className={styles.rememberForgot}>
                        <div className={styles.rememberMe}>
                            <input type="checkbox" id="remember" />
                            <label htmlFor="remember">Remember me</label>
                        </div>
                        <div className={styles.forgot}>
                            <a href="#">Forgot password</a>
                        </div>
                    </div>

                    <div className={styles.inputBox}>
                        <input type="submit" className={styles.inputSubmit} value="Login" />
                    </div>

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