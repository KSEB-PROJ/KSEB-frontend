import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import styles from './ProfilePage.module.css';
import { updateUserProfile, changePassword, getCurrentUser } from '../../api/users';
import { AxiosError } from 'axios';
import type { UserResponse } from '../../types';

const ProfilePage: React.FC = () => {
    const navigate = useNavigate();

    // 상태 관리
    const [currentUser, setCurrentUser] = useState<UserResponse | null>(null);
    const [name, setName] = useState('');
    const [profileFile, setProfileFile] = useState<File | null>(null); // 실제 파일 객체 저장
    const [profilePreview, setProfilePreview] = useState<string | null>(null);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [passwordConfirm, setPasswordConfirm] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    // 컴포넌트 마운트 시 현재 유저 정보 불러오기
    useEffect(() => {
        const fetchUser = async () => {
            try {
                // API 함수 호출
                const { data } = await getCurrentUser();
                setCurrentUser(data);  // 받은 데이터를 currentUser 상태에 저장
                setName(data.name);  // 받은 이름으로 이름 입력칸 채우기
                if (data.profileImg) {
                    // 받은 이미지 주소로 미리보기 설정
                    setProfilePreview(`${import.meta.env.VITE_API_BASE_URL.replace('/api', '')}${data.profileImg}`);
                }
            } catch (error) {
                console.error("사용자 정보를 불러오는 중 에러 발생:", error);
                toast.error("사용자 정보를 불러오는데 실패했습니다.");
            }
        };
        fetchUser();  // 함수 실행
    }, []);  // []가 비어있으면 페이지가 처음 열릴 때 딱 한 번만 실행.

    // 정보 수정 핸들러
    const handleProfileEdit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        // 1. 이름 또는 프로필 이미지 변경 처리
        // 이름이 변경되었거나 새 프로필 파일이 있을 때만 API 호출
        const isNameChanged = currentUser?.name !== name.trim();
        if (isNameChanged || profileFile) {
            // API 함수 호출
            const promise = updateUserProfile(name.trim(), profileFile || undefined);
            toast.promise(promise, {
                loading: '프로필 정보 수정 중...',
                success: '프로필이 성공적으로 업데이트되었습니다.',
                error: (err: AxiosError<{ message?: string }>) =>
                    err.response?.data?.message || '프로필 수정에 실패했습니다.',
            });
        }

        // 2. 비밀번호 변경 처리
        if (newPassword) {
            if (newPassword !== passwordConfirm) {
                toast.error("새 비밀번호와 비밀번호 확인이 일치하지 않습니다.");
                return;
            }
            if (!currentPassword) {
                toast.error("현재 비밀번호를 입력해주세요.");
                return;
            }

            const promise = changePassword({ currentPassword, newPassword });
            toast.promise(promise, {
                loading: '비밀번호 변경 중...',
                success: '비밀번호가 성공적으로 변경되었습니다.',
                error: (err: AxiosError<{ message?: string }>) =>
                    err.response?.data?.message || '비밀번호 변경에 실패했습니다.',
            });
        }

        // 모든 요청이 끝난 후 페이지를 새로고침하거나 데이터를 다시 불러오는 로직.
        // 여기서는 간단하게 홈으로 이동.
        if ((isNameChanged || profileFile) || newPassword) {
            setTimeout(() => navigate('/app/home'), 2000);
        }
    };

    // 파일 변경 핸들러
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setProfileFile(file); // 파일 객체 저장
            setProfilePreview(URL.createObjectURL(file)); // 미리보기 URL 생성
        }
    };

    const togglePasswordVisibility = () => setShowPassword(prev => !prev);

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>프로필 수정</h1>
            <p className={styles.description}>이곳에서 사용자 정보를 수정할 수 있습니다.</p>
            <form onSubmit={handleProfileEdit}>
                {/* 프로필 이미지 수정 영역 */}
                <label htmlFor="profileImgInput" className={styles.profileField} style={{ cursor: "pointer" }}>
                    <input
                        type="file"
                        accept="image/*"
                        id="profileImgInput"
                        style={{ display: "none" }}
                        onChange={handleFileChange}
                    />
                    {/* profilePreview가 있으면 무조건 표시 */}
                    {profilePreview && (
                        <img src={profilePreview} alt="프로필 미리보기"
                            style={{
                                width: '100%', height: '100%', objectFit: 'cover'
                            }}
                        />
                    )}
                    <i className={`bx bx-edit ${styles.editIcon}`}></i>
                </label>

                {/* 사용자명 수정 영역 */}
                <div className={styles.inputBox}>
                    <input
                        type="text"
                        id="name"
                        className={styles.inputField}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder=" "
                    />
                    <label htmlFor="name" className={styles.label}>
                        새로운 사용자명
                    </label>
                    <i className={`bx bx-user ${styles.icon}`}></i>
                </div>

                {/* 현재 비밀번호 입력 영역 */}
                <div className={styles.inputBox}>
                    <input
                        type={showPassword ? "text" : "password"}
                        id="currentPassword"
                        className={styles.inputField}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder=" "
                    />
                    <label htmlFor="currentPassword" className={styles.label}>
                        현재 비밀번호
                    </label>
                    <i
                        className={`bx bx-lock-alt ${styles.icon}`}
                        onClick={togglePasswordVisibility}
                        style={{ cursor: "pointer" }}
                    ></i>
                </div>

                {/* 새 비밀번호 입력 영역 */}
                <div className={styles.inputBox}>
                    <input
                        type={showPassword ? "text" : "password"}
                        id="newPassword"
                        className={styles.inputField}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder=" "
                    />
                    <label htmlFor="newPassword" className={styles.label}>
                        새 비밀번호
                    </label>
                    <i
                        className={`bx bx-lock-alt ${styles.icon}`}
                        onClick={togglePasswordVisibility}
                        style={{ cursor: "pointer" }}
                    ></i>
                </div>

                {/* 새 비밀번호 확인 영역 */}
                <div className={styles.inputBox}>
                    <input
                        type={showPassword ? "text" : "password"}
                        id="passwordConfirm"
                        className={styles.inputField}
                        value={passwordConfirm}
                        onChange={(e) => setPasswordConfirm(e.target.value)}
                        placeholder=" "
                        required={!!newPassword}
                    />
                    <label htmlFor="passwordConfirm" className={styles.label}>
                        새 비밀번호 확인
                    </label>
                    <i
                        className={`bx bx-lock-alt ${styles.icon}`}
                        onClick={togglePasswordVisibility}
                        style={{ cursor: "pointer" }}
                    ></i>
                </div>

                <div className={styles.inputBox}>
                    <input type="submit" className={styles.inputSubmit} value="정보 수정" />
                </div>

                <div className={styles.removeBox}>
                    <input type="button" className={styles.inputRemove} value="탈퇴하기" />
                </div>
            </form>
        </div>
    );
};

export default ProfilePage;