import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import type { Course } from '../types';
import styles from './UniversityTimetable.module.css';

interface Props {
    course: Partial<Course> | null;
    onClose: () => void;
    onSave: (course: Course) => void;
    onDelete: (courseId: number) => void;
}

const CourseModal: React.FC<Props> = ({ course, onClose, onSave, onDelete }) => {
    const [formData, setFormData] = useState<Partial<Course> | null>(null);

    useEffect(() => {
        // 모달이 열릴 때 전달받은 course 정보로 내부 상태 초기화
        setFormData(course);
    }, [course]);

    if (!formData) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => prev ? { ...prev, [name]: value } : null);
    };

    const handleSave = () => {
        // 모든 필드가 채워졌는지 검증 후 저장
        if (
            formData.course_name &&
            formData.professor &&
            formData.location &&
            formData.day_of_week &&
            formData.start_time &&
            formData.end_time
        ) {
            onSave(formData as Course);
        } else {
            alert('모든 필수 항목을 입력해주세요.');
        }
    };

    const handleDelete = () => {
        if (formData.id && window.confirm('이 강의를 시간표에서 삭제하시겠습니까?')) {
            onDelete(formData.id);
        }
    };

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modalContainer} onClick={(e) => e.stopPropagation()}>
                <header className={styles.modalHeader}>
                    <h2>{formData.id ? '강의 정보 수정' : '새 강의 추가'}</h2>
                    <button className={styles.closeButton} onClick={onClose}><FontAwesomeIcon icon={faTimes} /></button>
                </header>

                <main className={styles.modalContent}>
                    <div className={styles.inputGroup}>
                        <label className={styles.label}>강의명</label>
                        <input type="text" name="course_name" value={formData.course_name || ''} onChange={handleChange} className={styles.input} />
                    </div>
                    <div className={styles.rowGroup}>
                        <div className={styles.inputGroup}>
                            <label className={styles.label}>담당 교수</label>
                            <input type="text" name="professor" value={formData.professor || ''} onChange={handleChange} className={styles.input} />
                        </div>
                        <div className={styles.inputGroup}>
                            <label className={styles.label}>강의실</label>
                            <input type="text" name="location" value={formData.location || ''} onChange={handleChange} className={styles.input} />
                        </div>
                    </div>
                    <div className={styles.rowGroup}>
                        <div className={styles.inputGroup}>
                            <label className={styles.label}>요일</label>
                            <select name="day_of_week" value={formData.day_of_week || 'MO'} onChange={handleChange} className={styles.select}>
                                <option value="MO">월요일</option>
                                <option value="TU">화요일</option>
                                <option value="WE">수요일</option>
                                <option value="TH">목요일</option>
                                <option value="FR">금요일</option>
                            </select>
                        </div>
                        <div className={styles.inputGroup}>
                            <label className={styles.label}>학기</label>
                            <input type="text" name="semester" placeholder='예: 2025-1' value={formData.semester || ''} onChange={handleChange} className={styles.input} />
                        </div>
                    </div>
                    <div className={styles.rowGroup}>
                        <div className={styles.inputGroup}>
                            <label className={styles.label}>시작 시간</label>
                            <input type="time" name="start_time" value={formData.start_time || ''} onChange={handleChange} className={styles.input} />
                        </div>
                        <div className={styles.inputGroup}>
                            <label className={styles.label}>종료 시간</label>
                            <input type="time" name="end_time" value={formData.end_time || ''} onChange={handleChange} className={styles.input} />
                        </div>
                    </div>
                </main>

                <footer className={styles.modalFooter}>
                    <div>
                        {formData.id && <button onClick={handleDelete} className={styles.deleteButton}>삭제</button>}
                    </div>
                    <div className={styles.actionButtons}>
                        <button onClick={onClose} className={`${styles.button} ${styles.cancelButton}`}>취소</button>
                        <button onClick={handleSave} className={`${styles.button} ${styles.saveButton}`}>저장</button>
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default CourseModal;