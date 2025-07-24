import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import styles from './ProfilePage.module.css';
import { useAuthStore } from '../../../stores/authStore';

const ProfilePage: React.FC = () => {
    const navigate = useNavigate();

    // Zustand 스토어에서 상태와 액션을 가져옴.
    const { user, updateProfile, changePassword } = useAuthStore();

    // 컴포넌트 내부 UI 상태 (사용자 입력값 관리)
    const [name, setName] = useState('');
    const [profileFile, setProfileFile] = useState<File | null>(null);
    const [profilePreview, setProfilePreview] = useState<string | null>(null);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [passwordConfirm, setPasswordConfirm] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    // 스토어의 user 정보가 변경될 때마다 컴포넌트 상태를 초기화.
    useEffect(() => {
        if (user) {
            setName(user.name);
            const imageUrl = user.profileImg
                ? `${import.meta.env.VITE_PUBLIC_URL}${user.profileImg}`
                : `${import.meta.env.VITE_PUBLIC_URL}/profile-images/default-profile.png`;
            setProfilePreview(imageUrl);
        }
    }, [user]);

    // 정보 수정 폼 제출 핸들러
    const handleProfileEdit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const isNameChanged = user?.name !== name.trim();
        const isPasswordChanged = newPassword.trim() !== '';

        if (!isNameChanged && !profileFile && !isPasswordChanged) {
            toast('변경사항이 없습니다.');
            return;
        }

        let profileUpdated = false;
        let passwordChanged = false;

        // 이름 또는 프로필 이미지 변경 처리
        if (isNameChanged || profileFile) {
            profileUpdated = await updateProfile(name.trim(), profileFile || undefined);
        }

        // 비밀번호 변경 처리
        if (isPasswordChanged) {
            if (newPassword !== passwordConfirm) {
                toast.error("새 비밀번호와 비밀번호 확인이 일치하지 않습니다.");
                return;
            }
            if (!currentPassword) {
                toast.error("현재 비밀번호를 입력해주세요.");
                return;
            }
            passwordChanged = await changePassword({ currentPassword, newPassword });
        }

        // 성공적으로 변경된 경우, 2초 후 홈으로 이동
        if (profileUpdated || passwordChanged) {
            setTimeout(() => navigate('/app/home'), 2000);
        }
    };

    // 파일 선택 시 미리보기 업데이트 핸들러
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setProfileFile(file);
            setProfilePreview(URL.createObjectURL(file));
        }
    };

    const togglePasswordVisibility = () => setShowPassword(prev => !prev);

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>프로필 수정</h1>
            <p className={styles.description}>이곳에서 사용자 정보를 수정할 수 있습니다.</p>
            <form onSubmit={handleProfileEdit}>
                <label htmlFor="profileImgInput" className={styles.profileField} style={{ cursor: "pointer" }}>
                    <input
                        type="file"
                        accept="image/*"
                        id="profileImgInput"
                        style={{ display: "none" }}
                        onChange={handleFileChange}
                    />
                    {profilePreview && (
                        <img src={profilePreview} alt="프로필 미리보기"
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                    )}
                    <i className={`bx bx-edit ${styles.editIcon}`}></i>
                </label>
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
                        사용자명
                    </label>
                    <i className={`bx bx-user ${styles.icon}`}></i>
                </div>
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