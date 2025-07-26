import React, { useState, useLayoutEffect, useRef, useEffect } from 'react';
import { faPlus, faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { Course } from '../../../../types';
import styles from './UniversityTimetable.module.css';
import panelStyles from '../SchedulePage.module.css';
import CourseModal from './CourseModal';

import { useTimetableStore } from '../../../../stores/timetableStore';

// --- 레이아웃 상수 및 유틸리티 함수 ---
const START_HOUR = 9;
const HOUR_ROWS = 13;
const CELL_H = 40;
const HEADER_H = 25;
const TIME_COL_W = 40;

const timeToMin = (t: string): number => {
    if (!t) return 0;
    const [h, m] = t.split(':').map(val => parseInt(val, 10));
    return h * 60 + m;
};

const UniversityTimetable: React.FC = () => {
    // --- 스토어 상태 및 액션 ---
    // 스토어에서 직접 상태와 함수를 가져와 사용.
    const { courses, isLoading, semesterKey, setSemesterKey, fetchCourses, saveCourse, deleteCourse } = useTimetableStore();
    
    // --- 컴포넌트 내부 UI 상태 ---
    // semesterKey("YYYY-S1")를 UI 표시용(year, term)으로 변환하여 관리
    const [semester, setSemester] = useState(() => {
        const [year, termCode] = semesterKey.split('-');
        const termMap: { [key: string]: number } = { S1: 1, SU: 2, S2: 3, WI: 4 };
        return { year: parseInt(year, 10), term: termMap[termCode] || 1 };
    });
    const [modal, setModal] = useState(false);
    const [editing, setEditing] = useState<Partial<Course> | null>(null);
    const [anim, setAnim] = useState<'forward' | 'backward' | null>(null);

    const termDisplayMap: Record<number, string> = { 1: '1학기', 2: '여름학기', 3: '2학기', 4: '겨울학기' };
    const dayIdx: Record<string, number> = { MO: 0, TU: 1, WE: 2, TH: 3, FR: 4, SA: 5, SU: 6 };

    const gridRef = useRef<HTMLDivElement>(null);
    const [colW, setColW] = useState(0);

    // --- 데이터 로딩 ---
    useEffect(() => {
        fetchCourses();
    }, [fetchCourses]);

    // --- 레이아웃 계산 ---
    const measureLayout = () => {
        if (gridRef.current) {
            const gridRect = gridRef.current.getBoundingClientRect();
            setColW((gridRect.width - TIME_COL_W) / 5);
        }
    };

    useLayoutEffect(() => {
        measureLayout();
        window.addEventListener('resize', measureLayout);
        return () => window.removeEventListener('resize', measureLayout);
    }, []);

    // --- 핸들러 함수 ---
    const moveSem = (dir: 'prev' | 'next') => {
        setAnim(dir === 'next' ? 'forward' : 'backward');
        setTimeout(() => {
            setSemester((prev) => {
                let { year, term } = prev;
                if (dir === 'next') {
                    term = term === 4 ? 1 : term + 1;
                    year = term === 1 ? year + 1 : year;
                } else {
                    term = term === 1 ? 4 : term - 1;
                    year = term === 4 ? year - 1 : year;
                }
                const termCodeMap: { [key: number]: string } = { 1: 'S1', 2: 'SU', 3: 'S2', 4: 'WI' };
                setSemesterKey(`${year}-${termCodeMap[term]}`);
                return { year, term };
            });
            setAnim(null);
        }, 200);
    };

    const handleSaveCourse = async (data: Course) => {
        await saveCourse(data);
        setModal(false);
    };

    const handleDeleteCourse = async (id: number) => {
        await deleteCourse(id);
        setModal(false);
    };

    const openAdd = () => {
        setEditing({
            semester: semesterKey,
            dayOfWeek: 'MO',
            startTime: '09:00:00',
            endTime: '10:00:00',
            themeColor: '88, 80, 230'
        });
        setModal(true);
    };
    const openEdit = (c: Course) => { setEditing(c); setModal(true); };

    const hours = Array.from({ length: HOUR_ROWS }, (_, i) => START_HOUR + i);
    const days = ['MON', 'TUE', 'WED', 'THU', 'FRI'];
    const animClass = anim === 'forward' ? styles.slideOutLeft : anim === 'backward' ? styles.slideOutRight : styles.slideIn;

    return (
        <>
            <div className={`${panelStyles.panel} ${styles.timetableContainer}`}>
                <div className={styles.timetableHeader}>
                    <div className={styles.semesterNavigator}>
                        <button onClick={() => moveSem('prev')} className={styles.navButton}><FontAwesomeIcon icon={faChevronLeft} /></button>
                        <h3 className={styles.semesterTitle}>{`${semester.year}년 ${termDisplayMap[semester.term]}`}</h3>
                        <button onClick={() => moveSem('next')} className={styles.navButton}><FontAwesomeIcon icon={faChevronRight} /></button>
                    </div>
                    <button onClick={openAdd} className={styles.addButton}><FontAwesomeIcon icon={faPlus} /></button>
                </div>

                <div ref={gridRef} className={`${styles.timetableGrid} ${animClass}`}>
                    <div />{days.map(d => <div key={d} className={styles.gridHeader}>{d}</div>)}
                    {hours.map(h => (
                        <React.Fragment key={h}>
                            <div className={styles.gridTime}>{h}:00</div>
                            {days.map((_, col) => {
                                const hasLecture = courses.some(c => dayIdx[c.dayOfWeek] === col && timeToMin(c.startTime) < (h + 1) * 60 && timeToMin(c.endTime) > h * 60);
                                return <div key={col} className={styles.gridCell} onClick={hasLecture ? undefined : openAdd} />;
                            })}
                        </React.Fragment>
                    ))}
                    
                    {isLoading ? (
                        <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '2rem' }}>시간표를 불러오는 중...</div>
                    ) : (
                        courses.map(c => {
                            if (colW <= 0) return null;
                            const col = dayIdx[c.dayOfWeek];
                            const top = HEADER_H + (timeToMin(c.startTime) - START_HOUR * 60) / 60 * CELL_H + 15;
                            const height = (timeToMin(c.endTime) - timeToMin(c.startTime)) / 60 * CELL_H;
                            const left = TIME_COL_W + colW * col;

                            return (
                                <div key={c.id} className={styles.courseBlock}
                                    style={{ top: `${top}px`, left: `${left}px`, height: `${height - 1}px`, width: `${colW - 2}px`, '--course-color-rgb': c.themeColor } as React.CSSProperties}
                                    onClick={e => { e.stopPropagation(); openEdit(c); }}>
                                    <div className={styles.courseName}>{c.courseName}</div>
                                    <div className={styles.courseSubInfo}><span>{c.professor}</span><span>{c.location}</span></div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {modal && <CourseModal course={editing} onClose={() => setModal(false)} onSave={handleSaveCourse} onDelete={handleDeleteCourse} />}
        </>
    );
};

export default UniversityTimetable;