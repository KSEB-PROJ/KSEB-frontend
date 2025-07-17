import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import styles from './RegisterForm.module.css';
import { register } from '../../api/auth';
import { AxiosError } from 'axios';

const RegisterForm: React.FC = () => {
    // 사용자 입력 상태값 선언 (입력창 제어)
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirm, setPasswordConfirm] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();

    /**
     * 회원가입 폼 제출 이벤트 핸들러
     * - 기본 제출 동작 방지
     * - 비밀번호 일치 확인 후 API 서버에 회원가입 요청
     * - 결과에 따라 토스트 알림 표시
     */
    const handleRegister = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        // 비밀번호 일치 여부 확인
        if (password !== passwordConfirm) {
            toast.error('비밀번호가 일치하지 않습니다.');
            return;
        }

        // toast.promise를 사용하여 API 상태에 따라 알림 표시
        await toast.promise(
            register({ name, email, password }),
            {
                loading: '회원가입 처리 중...',
                success: () => {
                    navigate('/login'); // 성공 시 로그인 페이지로 이동
                    return <b>회원가입 완료! 로그인해주세요.</b>;
                },
                error: (err: AxiosError<{ message?: string }>) => {
                    return err.response?.data?.message || '회원가입에 실패했습니다.';
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
            {/* 회원가입 폼 전체를 감싸는 컨테이너 (중앙 정렬/배경 등 적용) */}
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
                            value={name}
                            onChange={(e) => setName(e.target.value)}
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
                            type="email"
                            id="email" //html id
                            className={styles.inputField} //CSS Modules로부터 스타일 적용
                            value={email} //현재 값
                            onChange={(e) => { setEmail(e.target.value) }} //값 변경 시 상태 업데이트
                            required //필수 입력
                        />
                        {/* 입력란 라벨 (floating label 효과, 스타일로 제어) */}
                        <label htmlFor="email" className={styles.label}>
                            Useremail
                        </label>
                        {/* 이메일 아이콘 (boxicons 아이콘 사용) */}
                        <i className={`bx bx-envelope-open ${styles.icon}`}></i>
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
                            value={passwordConfirm}
                            onChange={(e) => { setPasswordConfirm(e.target.value) }}
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