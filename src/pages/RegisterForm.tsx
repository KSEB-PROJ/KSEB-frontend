// src/pages/RegisterForm.tsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // 페이지 이동(네비게이션)을 위한 훅 import
import styles from './RegisterForm.module.css';   // CSS 모듈 import (컴포넌트 전용 스타일 적용)

// ※ 'boxicons' 아이콘 사용을 위해서는 public/index.html <head>에 CDN 링크 필요!
// 예: <link rel='stylesheet' href='https://unpkg.com/boxicons@2.1.4/css/boxicons.min.css'>

    
const RegisterForm: React.FC = () => {
    // 사용자 입력 상태값 선언 (입력창 제어)
    const [username, setUsername] = useState('');       // 사용자명
    const [useremail, setUseremail] = useState('');       // 사용자이메일
    const [password, setPassword] = useState('');       // 비밀번호
    const [passwordconfirm, setPasswordConfirm] = useState('');       // 비밀번호 확인
    const [showPassword, setShowPassword] = useState(false); // 비밀번호 표시 여부(토글)
    const navigate = useNavigate(); // 리액트 라우터의 페이지 이동 함수

    /*
     * 회원가입 폼 제출 이벤트 핸들러
     * - 기본 제출 동작 방지
     * - 회원가입 후 /login 페이지로 이동
     * - 아니면 경고창
     */
    const handleRegister = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault(); // 페이지 새로고침 방지
        navigate('/login');    
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
            <div className={styles.RegisterBox}>
                {/* 상단 타이틀 (Register) */}
                <div className={styles.RegisterHeader}>
                    <span>Register</span>
                </div>
                {/* 실제 회원가입 입력/제출 폼 */}
                <form onSubmit={handleRegister}>
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

                    {/* 사용자이메일 입력 영역 */}
                    <div className={styles.inputBox}>
                        {/* 텍스트 입력 필드 (사용자이메일) */}
                        <input
                            type="text"
                            id="email" //html id
                            className={styles.inputField} //CSS Modules로부터 스타일 적용
                            value={useremail} //현재 값
                            onChange={(e) => setUseremail(e.target.value)} //값 변경 시 상태 업데이트
                            required //필수 입력
                        />
                        {/* 입력란 라벨 (floating label 효과, 스타일로 제어) */}
                        <label htmlFor="email" className={styles.label}>
                            Useremail
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

                    {/* 비밀번호 확인 영역 */}
                    <div className={styles.inputBox}>
                        {/* 비밀번호 입력 필드 (보이기/숨기기 토글 지원) */}
                        <input
                            type={showPassword ? "text" : "password"} // 보이기 여부에 따라 type 전환
                            className={styles.inputField}
                            value={passwordconfirm}
                            onChange={(e) => {setPasswordConfirm(e.target.value);
                            // 입력시마다 일치여부 체크 (에러 해제)
                            if (password !== e.target.value) {
                                e.target.setCustomValidity("비밀번호가 일치하지 않습니다.");
                            } else {
                                e.target.setCustomValidity("");
                            }}}
                            required
                        />
                        {/* 입력란 라벨 */}
                        <label htmlFor="passc" className={styles.label}>
                            PasswordConfirm
                        </label>
                        {/* 자물쇠 아이콘 (클릭하면 비밀번호 보이기/숨기기) */}
                        <i
                            className={`bx bx-lock-alt ${styles.icon}`}
                            onClick={togglePasswordVisibility}
                            style={{ cursor: "pointer" }}
                            title={showPassword ? "Hide password" : "Show password"}
                        ></i>
                        {/* 입력란 라벨 */}
                    </div>

                    {/* 회원가입 제출 버튼 */}
                    <div className={styles.inputBox}>
                        <input type="submit" className={styles.inputSubmit} value="Register" />
                    </div>

                </form>
            </div>
        </div>
    );
};

export default RegisterForm;

