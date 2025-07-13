import React, { useState, useMemo, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faChevronLeft, faChevronRight, faTimes } from '@fortawesome/free-solid-svg-icons';
import type { Course } from './types';
import styles from './UniversityTimetable.module.css';
import panelStyles from './SchedulePage.module.css';

// Mock Data & Color Palette
const allMockCourses: Course[] = [
    { id: 1, course_code: 'CS101', course_name: '컴퓨터과학개론', professor: '김철수', semester: '2025-1', day_of_week: 'MO', start_time: '10:30', end_time: '12:00', location: '공학관 101호', color: '88, 80, 230' },
    { id: 2, course_code: 'GD203', course_name: 'UX/UI 디자인', professor: '박영희', semester: '2025-1', day_of_week: 'TU', start_time: '13:00', end_time: '15:00', location: '디자인관 302호', color: '229, 9, 111' },
    { id: 3, course_code: 'CS202', course_name: '자료구조', professor: '최민준', semester: '2025-S', day_of_week: 'WE', start_time: '09:00', end_time: '12:00', location: '공학관 203호', color: '23, 168, 143' },
];
const colorPalette = [ '88, 80, 230', '229, 9, 111', '23, 168, 143', '232, 119, 45', '45, 155, 229' ];

// Helper Function
const timeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
};

// Sub-components
const TimePicker: React.FC<{ selected: string; onChange: (time: string) => void; }> = ({ selected, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const options = Array.from({ length: 27 }, (_, i) => `${String(Math.floor(i / 2) + 8).padStart(2, '0')}:${String((i % 2) * 30).padStart(2, '0')}`);
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false); };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    return (
        <div className={styles.timePicker} ref={ref}><input type="text" readOnly value={selected} onClick={() => setIsOpen(!isOpen)} className={`${styles.input} ${styles.timeInput}`} />{isOpen && ( <div className={styles.timePickerPopup}> {options.map(time => ( <div key={time} className={`${styles.timeOption} ${selected === time ? styles.selected : ''}`} onClick={() => { onChange(time); setIsOpen(false); }}>{time}</div> ))} </div> )}</div>
    );
};

const CourseModal: React.FC<{ course: Partial<Course> | null; onClose: () => void; onSave: (c: Course) => void; onDelete: (id: number) => void; }> = ({ course, onClose, onSave, onDelete }) => {
    const [formData, setFormData] = useState<Partial<Course> | null>(null);
    useEffect(() => { setFormData(course); }, [course]);
    if (!formData) return null;
    const handleChange = (field: keyof Course, value: string) => { setFormData(prev => prev ? { ...prev, [field]: value } : null); };
    const handleSave = () => { if (formData.course_name && formData.day_of_week && formData.start_time && formData.end_time && formData.professor && formData.location) { if (timeToMinutes(formData.start_time) >= timeToMinutes(formData.end_time)) { alert('종료 시간은 시작 시간보다 늦어야 합니다.'); return; } onSave({ ...formData, color: formData.color || colorPalette[0] } as Course); } else { alert('모든 필수 항목을 입력해주세요.'); } };
    const handleDelete = () => { if (formData.id && window.confirm('이 강의를 시간표에서 삭제하시겠습니까?')) onDelete(formData.id); };
    return (
        <div className={styles.modalOverlay} onClick={onClose}><div className={styles.modalContainer} onClick={(e) => e.stopPropagation()}><header className={styles.modalHeader}><h2>{formData.id ? '강의 정보 수정' : '새 강의 추가'}</h2><button className={styles.closeButton} onClick={onClose}><FontAwesomeIcon icon={faTimes} /></button></header><main className={styles.modalContent}><div className={styles.inputGroup}><label className={styles.label}>강의명</label><input type="text" value={formData.course_name || ''} onChange={(e) => handleChange('course_name', e.target.value)} className={styles.input} /></div><div className={styles.rowGroup}><div className={styles.inputGroup}><label className={styles.label}>담당 교수</label><input type="text" value={formData.professor || ''} onChange={(e) => handleChange('professor', e.target.value)} className={styles.input} /></div><div className={styles.inputGroup}><label className={styles.label}>강의실</label><input type="text" value={formData.location || ''} onChange={(e) => handleChange('location', e.target.value)} className={styles.input} /></div></div><div className={styles.rowGroup}><div className={styles.inputGroup}><label className={styles.label}>요일</label><select value={formData.day_of_week || 'MO'} onChange={(e) => handleChange('day_of_week', e.target.value)} className={styles.select}><option value="MO">월요일</option><option value="TU">화요일</option><option value="WE">수요일</option><option value="TH">목요일</option><option value="FR">금요일</option></select></div><div className={styles.inputGroup}><label className={styles.label}>학기</label><input type="text" readOnly value={formData.semester || ''} className={styles.input} style={{ background: '#333' }} /></div></div><div className={styles.rowGroup}><div className={styles.inputGroup}><label className={styles.label}>시작 시간</label><TimePicker selected={formData.start_time || '09:00'} onChange={(time) => handleChange('start_time', time)} /></div><div className={styles.inputGroup}><label className={styles.label}>종료 시간</label><TimePicker selected={formData.end_time || '10:00'} onChange={(time) => handleChange('end_time', time)} /></div></div><div className={styles.inputGroup}><label className={styles.label}>강의 색상</label><div className={styles.colorPalette}>{colorPalette.map(color => (<div key={color} className={`${styles.colorOrb} ${(formData.color || colorPalette[0]) === color ? styles.selected : ''}`} style={{ backgroundColor: `rgb(${color})` }} onClick={() => handleChange('color', color)} />))}</div></div></main><footer className={styles.modalFooter}><div>{formData.id && <button onClick={handleDelete} className={styles.deleteButton}>삭제</button>}</div><div className={styles.actionButtons}><button onClick={onClose} className={`${styles.button} ${styles.cancelButton}`}>취소</button><button onClick={handleSave} className={`${styles.button} ${styles.saveButton}`}>저장</button></div></footer></div></div>
    );
};

// Main Timetable Component
const UniversityTimetable: React.FC = () => {
    const [courses, setCourses] = useState<Course[]>(allMockCourses);
    const [semester, setSemester] = useState({ year: 2025, term: 1 });
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCourse, setEditingCourse] = useState<Partial<Course> | null>(null);
    const [animationDirection, setAnimationDirection] = useState<'forward' | 'backward' | null>(null);
    
    const termMap: { [key: number]: string } = { 1: '1학기', 2: '여름학기', 3: '2학기', 4: '겨울학기' };
    const semesterString = `${semester.year}-${{1:'1', 2:'S', 3:'2', 4:'W'}[semester.term]}`;
    
    const handleNavigateSemester = (direction: 'prev' | 'next') => {
        setAnimationDirection(direction === 'next' ? 'forward' : 'backward');
        setTimeout(() => {
            setSemester(prev => { let { year, term } = prev; if (direction === 'next') { if (term === 4) { year++; term = 1; } else { term++; } } else { if (term === 1) { year--; term = 4; } else { term--; } } return { year, term }; });
            setAnimationDirection(null);
        }, 200); // 애니메이션 시간과 일치
    };
    
    const currentSemesterCourses = useMemo(() => courses.filter(c => c.semester === semesterString), [courses, semesterString]);
    const handleAddClick = () => { setEditingCourse({ semester: semesterString, day_of_week: 'MO', start_time: '09:00', end_time: '10:00', color: colorPalette[0] }); setIsModalOpen(true); };
    const handleCourseClick = (course: Course) => { setEditingCourse(course); setIsModalOpen(true); };
    const handleSaveCourse = (courseData: Course) => {
        const newStartTime = timeToMinutes(courseData.start_time);
        const newEndTime = timeToMinutes(courseData.end_time);
        const conflictingCourse = courses.find(existingCourse => {
            if (existingCourse.semester !== courseData.semester) return false;
            if (courseData.id && existingCourse.id === courseData.id) return false;
            if (existingCourse.day_of_week !== courseData.day_of_week) return false;
            const existingStartTime = timeToMinutes(existingCourse.start_time);
            const existingEndTime = timeToMinutes(existingCourse.end_time);
            return newStartTime < existingEndTime && newEndTime > existingStartTime;
        });
        if (conflictingCourse) { alert(`오류: "${conflictingCourse.course_name}" 강의와 시간이 겹칩니다.`); return; }
        if (courseData.id) { setCourses(prev => prev.map(c => c.id === courseData.id ? courseData : c)); } else { setCourses(prev => [...prev, { ...courseData, id: Date.now() }]); }
        setIsModalOpen(false);
    };
    const handleDeleteCourse = (courseId: number) => { setCourses(prev => prev.filter(c => c.id !== courseId)); setIsModalOpen(false); };
    const timeSlots = Array.from({ length: 13 }, (_, i) => 9 + i);
    const days = ['MON', 'TUE', 'WED', 'THU', 'FRI'];
    const dayMapping: { [key: string]: number } = { MO: 0, TU: 1, WE: 2, TH: 3, FR: 4 };

    const getAnimationClass = () => {
        if (animationDirection === 'forward') return styles.slideOutLeft;
        if (animationDirection === 'backward') return styles.slideOutRight;
        return styles.slideIn;
    };

    return (
        <>
            <div className={`${panelStyles.panel} ${styles.timetableContainer}`}>
                <div className={styles.timetableHeader}><div className={styles.semesterNavigator}><button onClick={() => handleNavigateSemester('prev')} className={styles.navButton} title="이전 학기"><FontAwesomeIcon icon={faChevronLeft} /></button><h3 className={styles.semesterTitle}>{`${semester.year}년 ${termMap[semester.term]}`}</h3><button onClick={() => handleNavigateSemester('next')} className={styles.navButton} title="다음 학기"><FontAwesomeIcon icon={faChevronRight} /></button></div><button onClick={handleAddClick} className={styles.addButton} title="새 강의 추가"><FontAwesomeIcon icon={faPlus} /></button></div>
                <div className={`${styles.timetableGrid} ${getAnimationClass()}`}>
                    <div />{days.map(day => <div key={day} className={styles.gridHeader}>{day}</div>)}
                    {timeSlots.map(time => (
                        <React.Fragment key={time}>
                            <div className={styles.gridTime}>{time}:00</div>
                            {days.map((_, dayIndex) => (
                                <div key={dayIndex} className={styles.gridCell} onClick={handleAddClick}>
                                    {currentSemesterCourses.filter(c => dayMapping[c.day_of_week] === dayIndex && parseInt(c.start_time.split(':')[0]) === time).map(course => {
                                        const start = parseInt(course.start_time.split(':')[0]) + parseInt(course.start_time.split(':')[1]) / 60;
                                        const end = parseInt(course.end_time.split(':')[0]) + parseInt(course.end_time.split(':')[1]) / 60;
                                        const duration = end - start;
                                        const topOffset = ((start - time) * 100);
                                        return (
                                            <div key={course.id} className={styles.courseBlock} style={{ height: `calc(${duration * 100}% + ${Math.max(0, Math.floor(duration - 1))} * 2px)`, top: `${topOffset}%`, '--course-color-rgb': course.color || colorPalette[0] } as React.CSSProperties}
                                                 onClick={(e) => { e.stopPropagation(); handleCourseClick(course); }} >
                                                <div className={styles.courseName}>{course.course_name}</div>
                                                <div className={styles.courseSubInfo}><span>{course.professor}</span><span>{course.location}</span></div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ))}
                        </React.Fragment>
                    ))}
                </div>
            </div>
            {isModalOpen && <CourseModal course={editingCourse} onClose={() => setIsModalOpen(false)} onSave={handleSaveCourse} onDelete={handleDeleteCourse} />}
        </>
    );
};

export default UniversityTimetable;