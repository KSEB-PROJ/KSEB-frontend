import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // 페이지 이동(네비게이션)을 위한 훅 import
import toast from 'react-hot-toast';
import styles from './ProfilePage.module.css';   // CSS 모듈 import (컴포넌트 전용 스타일 적용)
import { me,profileImage } from '../../api/users';
import { AxiosError } from 'axios';

const ProfilePage: React.FC = () => {
    // 사용자 입력 상태값 선언 (입력창 제어)
    const [profilePreview, setProfilePreview] = useState<string | null>(null);
    const [prevusername] = useState('기존 설정된 사용자명');
    const [name, setName] = useState('');       // 사용자명
    const [profileImg, setProfileImg] = useState('');
    const [prevuseremail] = useState('기존 설정된 사용자이메일');
    const [useremail, setUseremail] = useState('');       // 사용자이메일
    const [password, setPassword] = useState('');       // 비밀번호
    const [newPassword, setNewPassword] = useState('');       // 비밀번호 확인
    const [passwordConfirm, setPasswordConfirm] = useState('');
    const [showPassword, setShowPassword] = useState(false); // 비밀번호 표시 여부(토글)
    const navigate = useNavigate(); // 리액트 라우터의 페이지 이동 함수

    /*
     * - 기본 제출 동작 방지
     */
    const handleProfileEdit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault(); // 페이지 새로고침 
        if (newPassword && newPassword !== passwordConfirm) {
            alert("새 비밀번호와 비밀번호 확인이 일치하지 않습니다.");
            return;
        }
        console.log('Updated profile image file:', profileImg); //변수 미사용 오류 방지
        if (name){
        await toast.promise(
            me({ name }), // API 함수에 입력값 전달
            {
                loading: '프로필 이름 수정 중...',
                success: () => {
                    navigate('/app/home'); // 성공 시 페이지 이동
                    return <b>프로필 이름 수정 완료!!!</b>; // 성공 알림 메시지
                },
                error: (err: AxiosError<{ message?: string }>) => {
                    // 백엔드에서 온 에러 메시지를 우선적으로 사용
                    return err.response?.data?.message || '프로필 이름 수정에 실패했습니다.';
                },
            }
        ); }
        if (profileImg) {
          await toast.promise(
            profileImage ({ profileImg }), // API 함수에 입력값 전달
            {
                loading: '프로필 이미지 수정 중...',
                success: () => {
                    navigate('/app/home'); // 성공 시 페이지 이동
                    return <b>프로필 이미지 수정 완료!!!</b>; // 성공 알림 메시지
                },
                error: (err: AxiosError<{ message?: string }>) => {
                    // 백엔드에서 온 에러 메시지를 우선적으로 사용
                    return err.response?.data?.message || '프로필 이미지 수정에 실패했습니다.';
                },
            }
            );}

        navigate('/profile');
    };
    /**
     * 비밀번호 보이기/숨기기 토글 함수
     * - showPassword 상태값을 반전시켜 input type을 text/password로 전환
     */
    const togglePasswordVisibility = () => {
        setShowPassword(prev => !prev);
    };


    return (
        <div className={styles.container}>
            <h1 className={styles.title}>프로필 수정</h1>
            <p className={styles.description}>이곳에서 사용자 정보를 수정할 수 있습니다.</p>
            {/* 프로필 수정 폼 */}
            <form onSubmit={handleProfileEdit}>

                {/* 프로필 수정 영역 */}
                <label htmlFor="profileImg" className={styles.profileField} style={{ cursor: "pointer" }}>
                    {/* 숨겨진 파일 업로드 input */}
                    <input
                        type="file"
                        accept="image/*"
                        id="profileImg"
                        style={{ display: "none" }}
                        onChange={e => {
                            if (e.target.files && e.target.files[0]) {
                                const file = e.target.files[0];
                                setProfileImg(file.name);
                                setProfilePreview(URL.createObjectURL(file));
                            }
                        }} />
                    {/* 미리보기 이미지 */}
                    {profilePreview && (
                        <img src={profilePreview} alt="프로필 미리보기"
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                borderRadius: '50%',
                                position: 'absolute',
                                left: 0,
                                top: 0,
                                zIndex: 1
                            }} />)}
                    {/* 연필 아이콘 (hover 시만 보임) */}
                    <i className={`bx bx-edit ${styles.editIcon}`}></i>
                </label>

                {/* 사용자명 수정 영역 */}
                <div className={styles.inputBox}>
                    {/* 텍스트 입력 필드 (사용자명) */}
                    <input
                        type="text"
                        id="user"
                        className={styles.inputField}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
                    {/* 입력란 라벨 (floating label 효과, 스타일로 제어) */}
                    <label htmlFor="user" className={styles.label}>
                        {prevusername}   {/* 전에 설정된 사용자명 보임 */}
                    </label>
                    {/* 사용자 아이콘 (boxicons 아이콘 사용) */}
                    <i className={`bx bx-user ${styles.icon}`}></i>
                </div>

                {/* 사용자이메일 수정 영역 */}
                <div className={styles.inputBox}>
                    {/* 텍스트 입력 필드 (사용자이메일) */}
                    <input
                        type="email"
                        id="email" //html id
                        className={styles.inputField} //CSS Modules로부터 스타일 적용
                        value={useremail} //현재 값
                        onChange={(e) => { setUseremail(e.target.value) }} //값 변경 시 상태 업데이트
                    />
                    {/* 입력란 라벨 (floating label 효과, 스타일로 제어) */}
                    <label htmlFor="email" className={styles.label}>
                        {prevuseremail}
                    </label>
                    {/* 이메일 아이콘 (boxicons 아이콘 사용) */}
                    <i className={`bx bx-envelope-open ${styles.icon}`}></i>
                </div>

                {/* 기존 비밀번호 확인 영역 */}
                <div className={styles.inputBox}>
                    {/* 비밀번호 입력 필드 (보이기/숨기기 토글 지원) */}
                    <input
                        type={showPassword ? "text" : "password"} // 보이기 여부에 따라 type 전환
                        id="pass"
                        className={styles.inputField}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    {/* 입력란 라벨 */}
                    <label htmlFor="pass" className={styles.label}>
                        Last Password
                    </label>
                    {/* 자물쇠 아이콘 (클릭하면 비밀번호 보이기/숨기기) */}
                    <i
                        className={`bx bx-lock-alt ${styles.icon}`}
                        onClick={togglePasswordVisibility}
                        style={{ cursor: "pointer" }}
                        title={showPassword ? "Hide password" : "Show password"}
                    ></i>
                </div>

                {/* 비밀번호 수정 영역 */}
                <div className={styles.inputBox}>
                    {/* 비밀번호 입력 필드 (보이기/숨기기 토글 지원) */}
                    <input
                        type={showPassword ? "text" : "password"} // 보이기 여부에 따라 type 전환
                        className={styles.inputField}
                        value={newPassword}
                        onChange={(e) => { setNewPassword(e.target.value); }}
                    />
                    {/* 입력란 라벨 */}
                    <label htmlFor="npass" className={styles.label}>
                        New password
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
                            required={!!newPassword} //newpassword가 있을 때만 필수
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
                {/* 회원정보 수정 버튼 */}
                <div className={styles.inputBox}>
                    <input type="submit" className={styles.inputSubmit} value="정보 수정" />
                </div>

                {/* 탈퇴하기 버튼 */}
                <div className={styles.removeBox}>
                    <input type="submit" className={styles.inputRemove} value="탈퇴하기" />
                </div>

            </form>
        </div>
    );
};

export default ProfilePage;