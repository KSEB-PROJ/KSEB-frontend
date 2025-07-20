import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // 페이지 이동(네비게이션)을 위한 훅 import
import toast from 'react-hot-toast';
import styles from './LoginForm.module.css';   // CSS 모듈 import (컴포넌트 전용 스타일 적용)
import { Link } from 'react-router-dom';
import { login } from '../../api/auth';
import { AxiosError } from 'axios';

const LoginForm: React.FC = () => {
    // 입력값을 저장할 곳. 내가 입력하는 값이 바로 이 변수에 저장됨.
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false); // 비밀번호 표시 여부(토글)
    const navigate = useNavigate(); // 리액트 라우터의 페이지 이동 함수

    /*
     * 로그인 폼 제출 이벤트 핸들러 (버튼 클릭하면 백엔드에 진짜 로그인 요청 보내는 부분)
     * - 기본 제출 동작 방지
     * - API 서버에 로그인 요청을 보내고, 결과에 따라 페이지 이동 또는 에러 메시지 표시
     */
    const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault(); // 페이지 새로고침 방지

        // toast.promise를 사용하여 API 요청 상태에 따라 자동으로 알림을 보여줌.
        await toast.promise(
            login({ email, password }), // API 함수에 입력값 전달
            {
                loading: '로그인 중...',
                success: () => {
                    navigate('/app'); // 성공 시 페이지 이동
                    return <b>로그인 성공! 환영합니다.</b>; // 성공 알림 메시지
                },
                error: (err: AxiosError<{ message?: string }>) => {
                    // 백엔드에서 온 에러 메시지를 우선적으로 사용
                    return err.response?.data?.message || '로그인에 실패했습니다.';
                },
            }
        );
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
                {/* onSubmit={handleLogin} → 위에서 만든 함수 실행 */}
                <form onSubmit={handleLogin}>
                    {/* 사용자명(이메일) 입력 영역 */}
                    <div className={styles.inputBox}>
                        {/* 텍스트 입력 필드 (이메일) */}
                        <input
                            type="email"
                            id="email"
                            className={styles.inputField}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)} // 바뀔 때마다 값 저장
                            required
                        />
                        {/* 입력란 라벨 (floating label 효과, 스타일로 제어) */}
                        <label htmlFor="email" className={styles.label}>
                            Email Address
                        </label>
                        {/* 사용자 아이콘 (boxicons 아이콘 사용) */}
                        <i className={`bx bx-envelope ${styles.icon}`}></i>
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